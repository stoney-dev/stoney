// packages/runner/src/contract.ts
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { interpolate } from "./env.js";

export type HttpStep = {
  method: string;
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  body?: unknown;

  timeout_ms?: number;
  retries?: number;
};

export type ExecStep = {
  run: string;
  cwd?: string;
  env?: Record<string, string>;
  timeout_ms?: number;
  retries?: number;
  max_output_chars?: number;
};

export type SqlStep = {
  driver: "postgres";
  url_env: string;
  query: string;
  timeout_ms?: number;
};

export type Expectation = {
  // http
  status?: number;
  json?: unknown;
  bodyContains?: string;

  // exec
  exit_code?: number;
  stdout_contains?: string;
  stderr_contains?: string;

  // exec extras
  stdout_not_contains?: string;
  stderr_not_contains?: string;
  stdout_regex?: string;
  stderr_regex?: string;
  stdout_empty?: boolean;
  stderr_empty?: boolean;
  max_duration_ms?: number;

  // sql
  rows?: number;
  equals?: Record<string, unknown>;
};

export type Step =
  | { http: HttpStep; expect?: Expectation }
  | { exec: ExecStep; expect?: Expectation }
  | { sql: SqlStep; expect?: Expectation };

export type Check = {
  id: string;

  // v1: optional; enforcement is controlled by CLI (--require-work-item) / env
  work_item?: string;

  says?: string;
  links?: string[];

  // Required
  steps: Step[];
};

export type Contract = {
  name: string;
  description?: string;
  checks: Check[];
};

export type SuiteFileV1 = {
  version: 1;
  feature: string;
  description?: string;
  contracts: Contract[];
};

function fail(msg: string): never {
  throw new Error(msg);
}

function isObj(x: unknown): x is Record<string, any> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function asString(x: unknown): string {
  return typeof x === "string" ? x : String(x ?? "");
}

function asStringArray(x: unknown): string[] | undefined {
  if (!Array.isArray(x)) return undefined;
  const out = x.map((v) => String(v).trim()).filter(Boolean);
  return out.length ? out : undefined;
}

function asNumberOrUndef(x: unknown): number | undefined {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  return undefined;
}

function parseFile(abs: string): unknown {
  const raw = fs.readFileSync(abs, "utf8");
  if (abs.endsWith(".yml") || abs.endsWith(".yaml")) return yaml.load(raw);
  if (abs.endsWith(".json")) return JSON.parse(raw);
  fail(`Unsupported file type: ${abs}`);
}

function parseHttp(rawHttp: any, checkId: string): HttpStep {
  if (!isObj(rawHttp)) fail(`Check ${checkId}: http must be object.`);
  const method = asString(rawHttp.method || "").trim().toUpperCase();
  const pth = asString(rawHttp.path || "").trim();
  if (!method) fail(`Check ${checkId}: http.method is required.`);
  if (!pth.startsWith("/")) fail(`Check ${checkId}: http.path must start with "/".`);

  const timeout_ms = asNumberOrUndef(rawHttp.timeout_ms);
  const retries = asNumberOrUndef(rawHttp.retries);

  return {
    method,
    path: String(interpolate(pth)),
    headers: isObj(rawHttp.headers) ? (interpolate(rawHttp.headers) as any) : undefined,
    query: isObj(rawHttp.query) ? (interpolate(rawHttp.query) as any) : undefined,
    body: interpolate(rawHttp.body),
    timeout_ms,
    retries,
  };
}

function parseExec(rawExec: any, checkId: string): ExecStep {
  if (!isObj(rawExec)) fail(`Check ${checkId}: exec must be object.`);
  const run = asString(rawExec.run || "").trim();
  if (!run) fail(`Check ${checkId}: exec.run is required.`);

  return {
    run: String(interpolate(run)),
    cwd: typeof rawExec.cwd === "string" ? String(interpolate(rawExec.cwd)) : undefined,
    env: isObj(rawExec.env) ? (interpolate(rawExec.env) as any) : undefined,
    timeout_ms: typeof rawExec.timeout_ms === "number" ? rawExec.timeout_ms : undefined,
    retries: typeof rawExec.retries === "number" ? rawExec.retries : undefined,
    max_output_chars: typeof rawExec.max_output_chars === "number" ? rawExec.max_output_chars : undefined,
  };
}

function parseSql(rawSql: any, checkId: string): SqlStep {
  if (!isObj(rawSql)) fail(`Check ${checkId}: sql must be object.`);
  const driver = asString(rawSql.driver || "").trim();
  if (driver !== "postgres") fail(`Check ${checkId}: sql.driver must be "postgres".`);
  const url_env = asString(rawSql.url_env || "").trim();
  const query = asString(rawSql.query || "").trim();
  if (!url_env) fail(`Check ${checkId}: sql.url_env is required.`);
  if (!query) fail(`Check ${checkId}: sql.query is required.`);

  return {
    driver: "postgres",
    url_env: String(interpolate(url_env)),
    query: String(interpolate(query)),
    timeout_ms: typeof rawSql.timeout_ms === "number" ? rawSql.timeout_ms : undefined,
  };
}

function parseStep(st: any, checkId: string, i: number): Step {
  if (!isObj(st)) fail(`Check ${checkId}: steps[${i}] must be object.`);

  const expect = isObj(st.expect) ? (interpolate(st.expect) as any) : undefined;

  if (isObj(st.http)) return { http: parseHttp(st.http, checkId), expect };
  if (isObj(st.exec)) return { exec: parseExec(st.exec, checkId), expect };
  if (isObj(st.sql)) return { sql: parseSql(st.sql, checkId), expect };

  fail(`Check ${checkId}: steps[${i}] must include one of {http|exec|sql}.`);
}

function parseCheck(raw: any): Check {
  if (!isObj(raw)) fail(`Check must be an object.`);
  const id = asString(raw.id || "").trim();
  if (!id) fail(`Check id required.`);

  const work_item = asString(raw.work_item || "").trim() || undefined;
  const says = asString(raw.says).trim() || undefined;
  const links = asStringArray(raw.links);

  if (!Array.isArray(raw.steps) || raw.steps.length === 0) {
    fail(`Check ${id}: steps must be a non-empty array.`);
  }

  const steps: Step[] = raw.steps.map((st: any, i: number) => parseStep(st, id, i));

  const out: any = { id, steps };
  if (work_item) out.work_item = work_item;
  if (says) out.says = says;
  if (links) out.links = links;

  return interpolate(out) as any;
}

export function loadSuite(filePath: string): SuiteFileV1 {
  const abs = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) fail(`Contract file not found: ${abs}`);

  const data = parseFile(abs);
  if (!isObj(data)) fail("Contract file must be an object.");

  if (data.version !== 1) fail(`Unsupported version: ${String(data.version)} (expected 1)`);

  const feature = asString(data.feature || "").trim();
  if (!feature) fail(`feature must be a non-empty string.`);

  const description = asString(data.description).trim() || undefined;

  if (!Array.isArray(data.contracts) || data.contracts.length === 0) {
    fail("contracts must be a non-empty array.");
  }

  const contracts: Contract[] = data.contracts.map((c: any, ci: number) => {
    if (!isObj(c)) fail(`contracts[${ci}] must be an object.`);
    const name = asString(c.name || "").trim();
    if (!name) fail(`contracts[${ci}].name must be a non-empty string.`);

    const desc = asString(c.description).trim() || undefined;

    if (!Array.isArray(c.checks) || c.checks.length === 0) {
      fail(`contracts[${ci}].checks must be a non-empty array.`);
    }

    const checks: Check[] = c.checks.map((chk: any) => parseCheck(chk));

    const seen = new Set<string>();
    for (const chk of checks) {
      if (seen.has(chk.id)) fail(`Duplicate check id in contract "${name}": ${chk.id}`);
      seen.add(chk.id);
    }

    const out: Contract = { name, checks };
    if (desc) out.description = String(interpolate(desc));
    return out;
  });

  const suite: SuiteFileV1 = { version: 1, feature, contracts };
  if (description) suite.description = String(interpolate(description));
  return suite;
}