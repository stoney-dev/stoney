import fs from "node:fs";
import path from "node:path";
import { resolveFakePlaceholders } from "./fake.js";
import { interpolate } from "./env.js";
import { deepSubsetMatch } from "./match.js";
import type { HttpStep, Expectation } from "./schema.js";
import type { StepResult } from "./types.js";

function joinUrl(baseUrl: string, pth: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const p = pth.startsWith("/") ? pth : `/${pth}`;
  return `${base}${p}`;
}

function withQuery(
  url: string,
  query?: Record<string, string | number | boolean>
): string {
  if (!query) return url;
  const u = new URL(url);
  for (const [k, v] of Object.entries(query)) u.searchParams.set(k, String(v));
  return u.toString();
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

function envNum(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw >= 0 ? raw : fallback;
}

function isObj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function looksLikeBodyObject(
  x: unknown
): x is { json?: unknown; jsonFile?: string; text?: string } {
  if (!isObj(x)) return false;
  return "json" in x || "jsonFile" in x || "text" in x;
}

export async function runHttpStep(
  baseUrl: string,
  step: HttpStep,
  expect?: Expectation
): Promise<StepResult> {
  const method = step.method.toUpperCase();
  const notes: string[] = [];

  const interpolatedHeaders = interpolate(step.headers || {});
  const headers: Record<string, string> = isObj(interpolatedHeaders)
    ? Object.fromEntries(
        Object.entries(interpolatedHeaders).map(([k, v]) => [k, String(v)])
      )
    : {};

  const interpolatedQuery = interpolate(step.query || {});
  const query = isObj(interpolatedQuery)
    ? (Object.fromEntries(
        Object.entries(interpolatedQuery).map(([k, v]) => [
          k,
          v as string | number | boolean,
        ])
      ) as Record<string, string | number | boolean>)
    : undefined;

  const url = withQuery(joinUrl(baseUrl, step.path), query);

  const seedKey = [
    process.env.GITHUB_REPOSITORY || "local",
    method,
    url,
  ].join("|");

  let bodyText: string | undefined;

  if (step.body !== undefined && step.body !== null) {
    if (looksLikeBodyObject(step.body)) {
      if (typeof step.body.text === "string") {
        const interpolated = interpolate(step.body.text);
        bodyText =
          typeof interpolated === "string"
            ? interpolated
            : String(interpolated);
      } else if (typeof step.body.jsonFile === "string") {
        const abs = path.resolve(process.cwd(), step.body.jsonFile);
        if (!fs.existsSync(abs)) {
          return {
            ok: false,
            kind: "http",
            title: `http ${method} ${step.path}`,
            method,
            url,
            notes: [`body.jsonFile not found: ${abs}`],
          };
        }

        const raw = fs.readFileSync(abs, "utf8");
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          return {
            ok: false,
            kind: "http",
            title: `http ${method} ${step.path}`,
            method,
            url,
            notes: [`body.jsonFile is not valid JSON: ${abs}`],
          };
        }

        const interpolated = interpolate(parsed);
        const finalized = resolveFakePlaceholders(interpolated, seedKey);

        bodyText = JSON.stringify(finalized);
        if (!headers["content-type"])
          headers["content-type"] = "application/json";
      } else {
        const interpolated = interpolate(step.body.json);
        const finalized = resolveFakePlaceholders(interpolated, seedKey);

        bodyText = JSON.stringify(finalized);
        if (!headers["content-type"])
          headers["content-type"] = "application/json";
      }
    } else if (typeof step.body === "string") {
      const interpolated = interpolate(step.body);
      bodyText =
        typeof interpolated === "string" ? interpolated : String(interpolated);
    } else {
      const interpolated = interpolate(step.body);
      const finalized = resolveFakePlaceholders(interpolated, seedKey);

      bodyText = JSON.stringify(finalized);
      if (!headers["content-type"])
        headers["content-type"] = "application/json";
    }
  }

  const timeoutMs =
    typeof step.timeout_ms === "number" &&
    Number.isFinite(step.timeout_ms) &&
    step.timeout_ms > 0
      ? step.timeout_ms
      : envNum("STONEY_TIMEOUT_MS", 15000);

  const retries =
    typeof step.retries === "number" &&
    Number.isFinite(step.retries) &&
    step.retries >= 0
      ? step.retries
      : envNum("STONEY_RETRIES", 2);

  let lastErr: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(
        url,
        { method, headers, body: bodyText },
        timeoutMs
      );
      const status = res.status;
      const text = await res.text();

      let json: unknown | undefined;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        try {
          json = JSON.parse(text);
        } catch {
          notes.push("Response advertised JSON but failed to parse JSON.");
        }
      }

      let ok = true;
      const exp = expect || {};

      if (typeof exp.status === "number" && status !== exp.status) {
        ok = false;
        notes.push(`Expected status ${exp.status} but got ${status}.`);
      }

      if (
        typeof exp.bodyContains === "string" &&
        !text.includes(exp.bodyContains)
      ) {
        ok = false;
        notes.push(`Expected body to contain: "${exp.bodyContains}"`);
      }

      if (exp.json !== undefined) {
        if (json === undefined) {
          ok = false;
          notes.push("Expected JSON subset match, but response was not JSON.");
        } else if (!deepSubsetMatch(json, exp.json)) {
          ok = false;
          notes.push("Expected JSON subset did not match response JSON.");
        }
      }

      return {
        ok,
        kind: "http",
        title: `http ${method} ${step.path}`,
        status,
        method,
        url,
        notes,
      };
    } catch (e: any) {
      lastErr = e;
      if (attempt < retries) {
        const backoff = 500 * (attempt + 1);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
    }
  }

  return {
    ok: false,
    kind: "http",
    title: `http ${method} ${step.path}`,
    method,
    url,
    notes: [`Network/timeout error: ${lastErr?.message || String(lastErr)}`],
  };
}