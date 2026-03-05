// packages/runner/src/sql.ts
import pg from "pg";
import type { SqlStep, Expectation } from "./schema.js";
import type { StepResult } from "./types.js";
import { deepSubsetMatch } from "./match.js";


const { Client } = pg;

function isProbablyWriteSql(q: string): boolean {
  const s = q.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").trim().toLowerCase();
  const write = /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|vacuum|analyze)\b/;
  return write.test(s);
}

function isMultiStatement(q: string): boolean {
  const s = q.trim();
  if (!s.includes(";")) return false;
  const normalized = s.endsWith(";") ? s.slice(0, -1) : s;
  return normalized.includes(";");
}

export async function runSqlStep(step: SqlStep, expect?: Expectation): Promise<StepResult> {
  const title = `sql postgres (${step.url_env})`;
  const notes: string[] = [];

  const url = process.env[step.url_env];
  if (!url) {
    return {
      ok: false,
      kind: "sql",
      title,
      notes: [`Missing env var ${step.url_env}. Add it as a CI secret/env var and pass it to Stoney.`],
    };
  }

  const timeoutMs =
    typeof step.timeout_ms === "number" ? step.timeout_ms : Number(process.env.STONEY_TIMEOUT_MS || 15000);

  const allowWrite = String(process.env.STONEY_ALLOW_WRITE_SQL || "").toLowerCase() === "true";
  const allowMulti = String(process.env.STONEY_ALLOW_MULTI_SQL || "").toLowerCase() === "true";

  if (!allowMulti && isMultiStatement(step.query)) {
    return {
      ok: false,
      kind: "sql",
      title,
      notes: [`Blocked multi-statement SQL. Split into separate steps or set STONEY_ALLOW_MULTI_SQL=true.`],
    };
  }

  if (!allowWrite && isProbablyWriteSql(step.query)) {
    return {
      ok: false,
      kind: "sql",
      title,
      notes: [`Blocked write SQL by default. Use SELECT-only or set STONEY_ALLOW_WRITE_SQL=true.`],
    };
  }

  const client = new Client({ connectionString: url });

  try {
    await client.connect();

    // statement_timeout is in ms
    const ms = Math.max(1, Math.floor(Number.isFinite(timeoutMs) ? timeoutMs : 15000));
    await client.query(`SET statement_timeout = ${ms};`);

    // ✅ Extra safety: run queries as read-only unless explicitly allowed
    if (!allowWrite) {
      await client.query("BEGIN READ ONLY;");
    } else {
      await client.query("BEGIN;");
    }

    const res = await client.query(step.query);
    await client.query("COMMIT;");

    let ok = true;
    const exp = expect || {};

    if (typeof exp.rows === "number" && res.rowCount !== exp.rows) {
      ok = false;
      notes.push(`Expected rows ${exp.rows} but got ${res.rowCount}.`);
    }

    if (exp.equals !== undefined) {
      const first = res.rows?.[0];
      if (!first) {
        ok = false;
        notes.push("Expected equals match against first row, but query returned no rows.");
      } else if (!deepSubsetMatch(first, exp.equals)) {
        ok = false;
        notes.push("Expected SQL first-row subset did not match.");
      }
    }

    return {
      ok,
      kind: "sql",
      title,
      notes,
      rows: typeof res.rowCount === "number" ? res.rowCount : undefined,
    };
  } catch (e: any) {
    try {
      await client.query("ROLLBACK;");
    } catch {}
    return { ok: false, kind: "sql", title, notes: [`SQL error: ${e?.message || String(e)}`] };
  } finally {
    await client.end().catch(() => {});
  }
}