import { deepSubsetMatch } from "./match.js";
import type { Scenario } from "./contract.js";

export type ScenarioResult = {
  id: string;
  ok: boolean;
  method: string;
  url: string;
  status?: number;
  notes: string[];
};

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function withQuery(url: string, query?: Record<string, any>): string {
  if (!query) return url;
  const u = new URL(url);
  for (const [k, v] of Object.entries(query)) u.searchParams.set(k, String(v));
  return u.toString();
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function runScenarioHttp(baseUrl: string, s: Scenario): Promise<ScenarioResult> {
  const method = s.http.method.toUpperCase();
  const url = withQuery(joinUrl(baseUrl, s.http.path), s.http.query);
  const notes: string[] = [];

  const headers: Record<string, string> = { ...(s.http.headers || {}) };

  let body: string | undefined;
  if (s.http.body !== undefined && s.http.body !== null) {
    if (typeof s.http.body === "string") body = s.http.body;
    else {
      body = JSON.stringify(s.http.body);
      if (!headers["content-type"]) headers["content-type"] = "application/json";
    }
  }

  // Defaults that work well for staging URLs
  const timeoutMs = Number(process.env.STONEY_TIMEOUT_MS || 15000);
  const retries = Number(process.env.STONEY_RETRIES || 2);

  let lastErr: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { method, headers, body }, timeoutMs);
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

      const exp = s.expect || {};
      let ok = true;

      if (typeof exp.status === "number" && status !== exp.status) {
        ok = false;
        notes.push(`Expected status ${exp.status} but got ${status}.`);
      }

      if (typeof exp.bodyContains === "string" && !text.includes(exp.bodyContains)) {
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

      return { id: s.id, ok, method, url, status, notes };
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
    id: s.id,
    ok: false,
    method,
    url,
    notes: [`Network/timeout error: ${lastErr?.message || String(lastErr)}`],
  };
}
