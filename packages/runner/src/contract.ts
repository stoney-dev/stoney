import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { interpolate } from "./env.js";

/**
 * Requirements-as-code mapping.
 * Jira is optional: issue can be Jira key, GitHub issue, or any external ref.
 */
export type RequirementLink = {
  issue?: string; // e.g. "KAN-102"
  ac?: string[]; // e.g. ["AC-1", "AC-2"]
  text?: string; // short human label
  links?: string[]; // optional URLs (docs/designs/confluence/etc)
};

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

  // optional: runner uses this if present
  max_output_chars?: number;
};

export type SqlStep = {
  driver: "postgres";
  url_env: string; // env var holding connection string, e.g. STONEY_DB_URL
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

  // exec extras (supported by your exec runner)
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

export type Scenario = {
  id: string;

  /**
   * requirement mapping for this scenario (optionally merged with contract.req)
   */
  req?: RequirementLink;

  steps?: Step[];

  // legacy support:
  http?: HttpStep;
  exec?: ExecStep;
  sql?: SqlStep;
  expect?: Expectation;
};

export type Contract = {
  name: string;

  /**
   * Optional default requirements for all scenarios in this contract.
   * Scenario-level req merges/overrides this.
   */
  req?: RequirementLink;

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

function asString(x: unknown): string {
  return typeof x === "string" ? x : String(x ?? "");
}

function asStringArray(x: unknown): string[] | undefined {
  if (!Array.isArray(x)) return undefined;
  const out = x.map((v) => String(v).trim()).filter(Boolean);
  return out.length ? out : undefined;
}

function parseFile(abs: string): unknown {
  const raw = fs.readFileSync(abs, "utf8");
  if (abs.endsWith(".yml") || abs.endsWith(".yaml")) return yaml.load(raw);
  if (abs.endsWith(".json")) return JSON.parse(raw);
  fail(`Unsupported file type: ${abs}`);
}

function parseReq(raw: any): RequirementLink | undefined {
  if (!isObj(raw)) return undefined;

  const issue = asString(raw.issue).trim() || undefined;
  const text = asString(raw.text).trim() || undefined;
  const ac = asStringArray(raw.ac);
  const links = asStringArray(raw.links);

  const out: RequirementLink = {};
  if (issue) out.issue = issue;
  if (text) out.text = text;
  if (ac) out.ac = ac;
  if (links) out.links = links;

  // allow ${ENV} interpolation inside req too
  return Object.keys(out).length ? (interpolate(out) as any) : undefined;
}

/**
 * Merge rule:
 * - base first (contract.req), scenario overrides.
 * - arrays replace (not concat) to avoid surprising behavior.
 */
function mergeReq(base?: RequirementLink, override?: RequirementLink): RequirementLink | undefined {
  if (!base && !override) return undefined;
  const out: RequirementLink = { ...(base || {}) };

  if (override?.issue) out.issue = override.issue;
  if (override?.text) out.text = override.text;
  if (override?.ac) out.ac = override.ac;
  if (override?.links) out.links = override.links;

  return Object.keys(out).length ? out : undefined;
}

function parseHttp(rawHttp: any, id: string): HttpStep {
  if (!isObj(rawHttp)) fail(`Scenario ${id}: http must be object.`);
  const method = asString(rawHttp.method || "").trim().toUpperCase();
  const pth = asString(rawHttp.path || "").trim();
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
  const run = asString(rawExec.run || "").trim();
  if (!run) fail(`Scenario ${id}: exec.run is required.`);

  return {
    run: String(interpolate(run)),
    cwd: typeof rawExec.cwd === "string" ? String(interpolate(rawExec.cwd)) : undefined,
    env: isObj(rawExec.env) ? (interpolate(rawExec.env) as any) : undefined,
    timeout_ms: typeof rawExec.timeout_ms === "number" ? rawExec.timeout_ms : undefined,
    retries: typeof rawExec.retries === "number" ? rawExec.retries : undefined,
    max_output_chars: typeof rawExec.max_output_chars === "number" ? rawExec.max_output_chars : undefined,
  };
}

function parseSql(rawSql: any, id: string): SqlStep {
  if (!isObj(rawSql)) fail(`Scenario ${id}: sql must be object.`);
  const driver = asString(rawSql.driver || "").trim();
  if (driver !== "postgres") fail(`Scenario ${id}: sql.driver must be "postgres".`);
  const url_env = asString(rawSql.url_env || "").trim();
  const query = asString(rawSql.query || "").trim();
  if (!url_env) fail(`Scenario ${id}: sql.url_env is required.`);
  if (!query) fail(`Scenario ${id}: sql.query is required.`);

  return {
    driver: "postgres",
    url_env: String(interpolate(url_env)),
    query: String(interpolate(query)),
    timeout_ms: typeof rawSql.timeout_ms === "number" ? rawSql.timeout_ms : undefined,
  };
}

function normalizeScenario(raw: any, contractReq?: RequirementLink): Scenario {
  if (!isObj(raw)) fail(`Scenario must be an object.`);
  const id = asString(raw.id || "").trim();
  if (!id) fail(`Scenario id required.`);

  const scenarioReq = mergeReq(contractReq, parseReq(raw.req));
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

    return { id, req: scenarioReq, steps };
  }

  // legacy mode (single step)
  if (isObj(raw.http)) return { id, req: scenarioReq, steps: [{ http: parseHttp(raw.http, id), expect }] };
  if (isObj(raw.exec)) return { id, req: scenarioReq, steps: [{ exec: parseExec(raw.exec, id), expect }] };
  if (isObj(raw.sql)) return { id, req: scenarioReq, steps: [{ sql: parseSql(raw.sql, id), expect }] };

  fail(`Scenario ${id}: must contain steps[] or one of {http|exec|sql}.`);
}

export function loadSuite(filePath: string): SuiteFileV1 {
  const abs = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) fail(`Suite file not found: ${abs}`);

  const data = parseFile(abs);
  if (!isObj(data)) fail("Suite file must be an object.");

  if (data.version !== 1) fail(`Unsupported version: ${String(data.version)} (expected 1)`);
  if (typeof data.suite !== "string" || !data.suite.trim()) fail("suite must be a string.");
  if (!Array.isArray(data.contracts) || data.contracts.length === 0) fail("contracts must be a non-empty array.");

  const contracts: Contract[] = data.contracts.map((c: any, ci: number) => {
    if (!isObj(c)) fail(`contracts[${ci}] must be an object.`);
    if (typeof c.name !== "string" || !c.name.trim()) fail(`contracts[${ci}].name must string.`);
    if (!Array.isArray(c.scenarios) || c.scenarios.length === 0) fail(`contracts[${ci}].scenarios must be non-empty array.`);

    const contractReq = parseReq(c.req);
    const scenarios: Scenario[] = c.scenarios.map((s: any) => normalizeScenario(s, contractReq));

    const seen = new Set<string>();
    for (const s of scenarios) {
      if (seen.has(s.id)) fail(`Duplicate scenario id in contract "${c.name}": ${s.id}`);
      seen.add(s.id);
    }

    return { name: c.name, req: contractReq, scenarios };
  });

  return { version: 1, suite: data.suite, contracts };
}

/**
 * Helper used by CLI enforcement (optional)
 */
export function hasReqMapping(req: RequirementLink | undefined): boolean {
  if (!req) return false;
  if (typeof req.text === "string" && req.text.trim()) return true;
  if (typeof req.issue === "string" && req.issue.trim()) return true;
  if (Array.isArray(req.ac) && req.ac.length) return true;
  return false;
}
