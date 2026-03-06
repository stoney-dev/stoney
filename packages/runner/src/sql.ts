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

/**
 * Connects with a simple retry policy to handle transient CI networking issues.
 */
async function connectWithRetry(client: pg.Client, retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await client.connect();
      return;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

export async function runSqlStep(step: SqlStep, expect?: Expectation): Promise<StepResult> {
  const title = `sql postgres (${step.url_env})`;
  const notes: string[] = [];

  const url = process.env[step.url_env];
  if (!url) {
    // Debugging hint: log the available env keys if lookup fails
    console.error(`[Stoney Debug] Env var '${step.url_env}' is missing. Available keys: ${Object.keys(process.env).join(', ')}`);
    return {
      ok: false,
      kind: "sql",
      title,
      notes: [`Missing env var ${step.url_env}. Ensure it is set in the action inputs/secrets.`],
    };
  }

  const timeoutMs = typeof step.timeout_ms === "number" ? step.timeout_ms : Number(process.env.STONEY_TIMEOUT_MS || 15000);
  const allowWrite = String(process.env.STONEY_ALLOW_WRITE_SQL || "").toLowerCase() === "true";
  const allowMulti = String(process.env.STONEY_ALLOW_MULTI_SQL || "").toLowerCase() === "true";

  if (!allowMulti && isMultiStatement(step.query)) {
    return { ok: false, kind: "sql", title, notes: [`Blocked multi-statement SQL. Use STONEY_ALLOW_MULTI_SQL=true.`] };
  }

  if (!allowWrite && isProbablyWriteSql(step.query)) {
    return { ok: false, kind: "sql", title, notes: [`Blocked write SQL. Use SELECT-only or STONEY_ALLOW_WRITE_SQL=true.`] };
  }

  // Improved client config with SSL support for CI environments
  const client = new Client({ 
    connectionString: url,
    ssl: { rejectUnauthorized: false } // Essential for many CI/hosted DBs
  });

  try {
    await connectWithRetry(client);

    // Apply timeout
    const ms = Math.max(1, Math.floor(Number.isFinite(timeoutMs) ? timeoutMs : 15000));
    await client.query(`SET statement_timeout = ${ms};`);

    // Transaction logic
    await client.query(allowWrite ? "BEGIN;" : "BEGIN READ ONLY;");

    const res = await client.query(step.query);
    await client.query("COMMIT;");

    // Validation
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
        notes.push("Expected equals match, but query returned no rows.");
      } else if (!deepSubsetMatch(first, exp.equals)) {
        ok = false;
        notes.push("Expected SQL first-row subset did not match.");
      }
    }

    return { ok, kind: "sql", title, notes, rows: typeof res.rowCount === "number" ? res.rowCount : undefined };
  } catch (e: any) {
    try { await client.query("ROLLBACK;"); } catch {}
    return { ok: false, kind: "sql", title, notes: [`SQL error: ${e?.message || String(e)}`] };
  } finally {
    // Ensure we always clean up
    await client.end().catch(() => {});
  }
}