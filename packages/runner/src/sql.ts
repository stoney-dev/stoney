import pg from "pg";
import type { SqlStep, Expectation } from "./contract.js";
import type { StepResult } from "./types.js";
import { deepSubsetMatch } from "./match.js";

const { Client } = pg;

export async function runSqlStep(step: SqlStep, expect?: Expectation): Promise<StepResult> {
  const title = `sql postgres (${step.url_env})`;
  const notes: string[] = [];

  const url = process.env[step.url_env];
  if (!url) {
    return {
      ok: false,
      kind: "sql",
      title,
      notes: [`Missing env var ${step.url_env}. Add it as a GitHub Secret and pass it to the Action.`],
    };
  }

  const timeoutMs =
    typeof step.timeout_ms === "number" ? step.timeout_ms : Number(process.env.STONEY_TIMEOUT_MS || 15000);

  const client = new Client({ connectionString: url });

  try {
    await client.connect();

    const timer = setTimeout(() => {
      notes.push(`SQL timeout after ${timeoutMs}ms`);
      client.end().catch(() => {});
    }, timeoutMs);

    const res = await client.query(step.query);
    clearTimeout(timer);

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

    return { ok, kind: "sql", title, notes };
  } catch (e: any) {
    return { ok: false, kind: "sql", title, notes: [`SQL error: ${e?.message || String(e)}`] };
  } finally {
    await client.end().catch(() => {});
  }
}
