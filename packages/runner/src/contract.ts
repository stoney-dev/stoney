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
};

export type ExecStep = {
  run: string;
  cwd?: string;
  env?: Record<string, string>;
  timeout_ms?: number;
  retries?: number;
};

export type SqlStep = {
  driver: "postgres";
  url_env: string; // env var holding connection string, e.g. DATABASE_URL
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

  // sql
  rows?: number;
  equals?: Record<string, unknown>;
};

export type Step =
  | { http: HttpStep; expect?: Expectation }
  | { exec: ExecStep; expect?: Expectation }
  | { sql: SqlStep; expect?: Expectation };

export type Scenario = {
  id: string;
  steps?: Step[];

  // legacy support:
  http?: HttpStep;
  exec?: ExecStep;
  sql?: SqlStep;
  expect?: Expectation;
};

export type Contract = {
  name: string;
  scenarios: Scenario[];
};

export type SuiteFileV1 = {
  version: 1;
  suite: string;
  contracts: Contract[];
};

function fail(msg: string): never {
  throw new Error(msg);
}

function isObj(x: unknown): x is Record<string, any> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function parseFile(abs: string): unknown {
  const raw = fs.readFileSync(abs, "utf8");
  if (abs.endsWith(".yml") || abs.endsWith(".yaml")) return yaml.load(raw);
  if (abs.endsWith(".json")) return JSON.parse(raw);
  fail(`Unsupported file type: ${abs}`);
}

function parseHttp(rawHttp: any, id: string): HttpStep {
  if (!isObj(rawHttp)) fail(`Scenario ${id}: http must be object.`);
  const method = String(rawHttp.method || "").toUpperCase();
  const pth = String(rawHttp.path || "");
  if (!method) fail(`Scenario ${id}: http.method is required.`);
  if (!pth.startsWith("/")) fail(`Scenario ${id}: http.path must start with "/".`);

  return {
    method,
    path: String(interpolate(pth)),
    headers: isObj(rawHttp.headers) ? (interpolate(rawHttp.headers) as any) : undefined,
    query: isObj(rawHttp.query) ? (interpolate(rawHttp.query) as any) : undefined,
    body: interpolate(rawHttp.body),
  };
}

function parseExec(rawExec: any, id: string): ExecStep {
  if (!isObj(rawExec)) fail(`Scenario ${id}: exec must be object.`);
  const run = String(rawExec.run || "").trim();
  if (!run) fail(`Scenario ${id}: exec.run is required.`);

  return {
    run: String(interpolate(run)),
    cwd: typeof rawExec.cwd === "string" ? String(interpolate(rawExec.cwd)) : undefined,
    env: isObj(rawExec.env) ? (interpolate(rawExec.env) as any) : undefined,
    timeout_ms: typeof rawExec.timeout_ms === "number" ? rawExec.timeout_ms : undefined,
    retries: typeof rawExec.retries === "number" ? rawExec.retries : undefined,
  };
}

function parseSql(rawSql: any, id: string): SqlStep {
  if (!isObj(rawSql)) fail(`Scenario ${id}: sql must be object.`);
  const driver = String(rawSql.driver || "");
  if (driver !== "postgres") fail(`Scenario ${id}: sql.driver must be "postgres".`);
  const url_env = String(rawSql.url_env || "").trim();
  const query = String(rawSql.query || "").trim();
  if (!url_env) fail(`Scenario ${id}: sql.url_env is required.`);
  if (!query) fail(`Scenario ${id}: sql.query is required.`);

  return {
    driver: "postgres",
    url_env: String(interpolate(url_env)),
    query: String(interpolate(query)),
    timeout_ms: typeof rawSql.timeout_ms === "number" ? rawSql.timeout_ms : undefined,
  };
}

function normalizeScenario(raw: any): Scenario {
  if (!isObj(raw)) fail(`Scenario must be an object.`);
  const id = String(raw.id || "").trim();
  if (!id) fail(`Scenario id required.`);

  const expect = isObj(raw.expect) ? (interpolate(raw.expect) as any) : undefined;

  // steps mode
  if (Array.isArray(raw.steps)) {
    const steps: Step[] = raw.steps.map((st: any, i: number) => {
      if (!isObj(st)) fail(`Scenario ${id}: steps[${i}] must be object.`);
      const exp = isObj(st.expect) ? (interpolate(st.expect) as any) : undefined;

      if (isObj(st.http)) return { http: parseHttp(st.http, id), expect: exp };
      if (isObj(st.exec)) return { exec: parseExec(st.exec, id), expect: exp };
      if (isObj(st.sql)) return { sql: parseSql(st.sql, id), expect: exp };

      fail(`Scenario ${id}: steps[${i}] must include one of {http|exec|sql}.`);
    });

    return { id, steps };
  }

  // legacy mode (single step)
  if (isObj(raw.http)) return { id, steps: [{ http: parseHttp(raw.http, id), expect }] };
  if (isObj(raw.exec)) return { id, steps: [{ exec: parseExec(raw.exec, id), expect }] };
  if (isObj(raw.sql)) return { id, steps: [{ sql: parseSql(raw.sql, id), expect }] };

  fail(`Scenario ${id}: must contain steps[] or one of {http|exec|sql}.`);
}

export function loadSuite(filePath: string): SuiteFileV1 {
  const abs = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) fail(`Suite file not found: ${abs}`);

  const data = parseFile(abs);
  if (!isObj(data)) fail("Suite file must be an object.");

  if (data.version !== 1) fail(`Unsupported version: ${String(data.version)} (expected 1)`);
  if (typeof data.suite !== "string" || !data.suite.trim()) fail("suite must be a string.");
  if (!Array.isArray(data.contracts) || data.contracts.length === 0)
    fail("contracts must be a non-empty array.");

  const contracts: Contract[] = data.contracts.map((c: any, ci: number) => {
    if (!isObj(c)) fail(`contracts[${ci}] must be an object.`);
    if (typeof c.name !== "string" || !c.name.trim()) fail(`contracts[${ci}].name must string.`);
    if (!Array.isArray(c.scenarios) || c.scenarios.length === 0)
      fail(`contracts[${ci}].scenarios must be non-empty array.`);

    const scenarios: Scenario[] = c.scenarios.map((s: any) => normalizeScenario(s));

    const seen = new Set<string>();
    for (const s of scenarios) {
      if (seen.has(s.id)) fail(`Duplicate scenario id in contract "${c.name}": ${s.id}`);
      seen.add(s.id);
    }

    return { name: c.name, scenarios };
  });

  return { version: 1, suite: data.suite, contracts };
}
