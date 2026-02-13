// packages/runner/src/contract.ts
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { interpolate } from "./env.js";

const require = createRequire(import.meta.url);
// IMPORTANT: require() js-yaml so esbuild/tsup can bundle it into output reliably
const yaml = require("js-yaml") as typeof import("js-yaml");

export type HttpStep = {
  method: string;
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  body?: unknown;
};

export type Expectation = {
  status?: number;
  json?: unknown;
  bodyContains?: string;
};

export type Scenario = {
  id: string;
  http: HttpStep;
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

    const scenarios: Scenario[] = c.scenarios.map((s: any, si: number) => {
      if (!isObj(s)) fail(`contracts[${ci}].scenarios[${si}] must be an object.`);
      if (typeof s.id !== "string" || !s.id.trim()) fail(`scenario id required.`);
      if (!isObj(s.http)) fail(`Scenario ${s.id}: http must be object.`);

      const method = String(s.http.method || "").toUpperCase();
      const pth = String(s.http.path || "");
      if (!method) fail(`Scenario ${s.id}: http.method is required.`);
      if (!pth.startsWith("/")) fail(`Scenario ${s.id}: http.path must start with "/".`);

      const http: HttpStep = {
        method,
        path: String(interpolate(pth)),
        headers: isObj(s.http.headers) ? (interpolate(s.http.headers) as any) : undefined,
        query: isObj(s.http.query) ? (interpolate(s.http.query) as any) : undefined,
        body: interpolate(s.http.body),
      };

      const expect: Expectation | undefined = isObj(s.expect)
        ? {
            status: typeof s.expect.status === "number" ? s.expect.status : undefined,
            json: "json" in s.expect ? interpolate(s.expect.json) : undefined,
            bodyContains:
              typeof s.expect.bodyContains === "string"
                ? String(interpolate(s.expect.bodyContains))
                : undefined,
          }
        : undefined;

      return { id: s.id, http, expect };
    });

    const seen = new Set<string>();
    for (const s of scenarios) {
      if (seen.has(s.id)) fail(`Duplicate scenario id in contract "${c.name}": ${s.id}`);
      seen.add(s.id);
    }

    return { name: c.name, scenarios };
  });

  return { version: 1, suite: data.suite, contracts };
}
