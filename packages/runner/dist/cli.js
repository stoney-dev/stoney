#!/usr/bin/env node

// src/cli.ts
import fs2 from "fs";
import path2 from "path";
import fg from "fast-glob";
import { Command } from "commander";

// src/contract.ts
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

// src/env.ts
function isObj(x) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}
var ENV_RE = /\$\{([A-Z0-9_]+)\}/g;
function interpolate(input) {
  if (typeof input === "string") {
    return input.replace(ENV_RE, (_, name) => process.env[name] ?? "");
  }
  if (Array.isArray(input)) return input.map(interpolate);
  if (isObj(input)) {
    const out = {};
    for (const [k, v] of Object.entries(input)) out[k] = interpolate(v);
    return out;
  }
  return input;
}

// src/contract.ts
function fail(msg) {
  throw new Error(msg);
}
function isObj2(x) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}
function parseFile(abs) {
  const raw = fs.readFileSync(abs, "utf8");
  if (abs.endsWith(".yml") || abs.endsWith(".yaml")) return yaml.load(raw);
  if (abs.endsWith(".json")) return JSON.parse(raw);
  fail(`Unsupported file type: ${abs}`);
}
function loadSuite(filePath) {
  const abs = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) fail(`Suite file not found: ${abs}`);
  const data = parseFile(abs);
  if (!isObj2(data)) fail("Suite file must be an object.");
  if (data.version !== 1) fail(`Unsupported version: ${String(data.version)} (expected 1)`);
  if (typeof data.suite !== "string" || !data.suite.trim()) fail("suite must be a string.");
  if (!Array.isArray(data.contracts) || data.contracts.length === 0)
    fail("contracts must be a non-empty array.");
  const contracts = data.contracts.map((c, ci) => {
    if (!isObj2(c)) fail(`contracts[${ci}] must be an object.`);
    if (typeof c.name !== "string" || !c.name.trim()) fail(`contracts[${ci}].name must string.`);
    if (!Array.isArray(c.scenarios) || c.scenarios.length === 0)
      fail(`contracts[${ci}].scenarios must be non-empty array.`);
    const scenarios = c.scenarios.map((s, si) => {
      if (!isObj2(s)) fail(`contracts[${ci}].scenarios[${si}] must be an object.`);
      if (typeof s.id !== "string" || !s.id.trim()) fail(`scenario id required.`);
      if (!isObj2(s.http)) fail(`Scenario ${s.id}: http must be object.`);
      const method = String(s.http.method || "").toUpperCase();
      const pth = String(s.http.path || "");
      if (!method) fail(`Scenario ${s.id}: http.method is required.`);
      if (!pth.startsWith("/")) fail(`Scenario ${s.id}: http.path must start with "/".`);
      const http = {
        method,
        path: String(interpolate(pth)),
        headers: isObj2(s.http.headers) ? interpolate(s.http.headers) : void 0,
        query: isObj2(s.http.query) ? interpolate(s.http.query) : void 0,
        body: interpolate(s.http.body)
      };
      const expect = isObj2(s.expect) ? {
        status: typeof s.expect.status === "number" ? s.expect.status : void 0,
        json: "json" in s.expect ? interpolate(s.expect.json) : void 0,
        bodyContains: typeof s.expect.bodyContains === "string" ? String(interpolate(s.expect.bodyContains)) : void 0
      } : void 0;
      return { id: s.id, http, expect };
    });
    const seen = /* @__PURE__ */ new Set();
    for (const s of scenarios) {
      if (seen.has(s.id)) fail(`Duplicate scenario id in contract "${c.name}": ${s.id}`);
      seen.add(s.id);
    }
    return { name: c.name, scenarios };
  });
  return { version: 1, suite: data.suite, contracts };
}

// src/match.ts
function isObj3(x) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}
function deepSubsetMatch(actual, expected) {
  if (expected === null || typeof expected !== "object") return Object.is(actual, expected);
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    if (expected.length > actual.length) return false;
    for (let i = 0; i < expected.length; i++) {
      if (!deepSubsetMatch(actual[i], expected[i])) return false;
    }
    return true;
  }
  if (isObj3(expected)) {
    if (!isObj3(actual)) return false;
    for (const key of Object.keys(expected)) {
      if (!(key in actual)) return false;
      if (!deepSubsetMatch(actual[key], expected[key])) return false;
    }
    return true;
  }
  return false;
}

// src/http.ts
function joinUrl(baseUrl, path3) {
  const base = baseUrl.replace(/\/+$/, "");
  const p = path3.startsWith("/") ? path3 : `/${path3}`;
  return `${base}${p}`;
}
function withQuery(url, query) {
  if (!query) return url;
  const u = new URL(url);
  for (const [k, v] of Object.entries(query)) u.searchParams.set(k, String(v));
  return u.toString();
}
async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}
async function runScenarioHttp(baseUrl, s) {
  const method = s.http.method.toUpperCase();
  const url = withQuery(joinUrl(baseUrl, s.http.path), s.http.query);
  const notes = [];
  const headers = { ...s.http.headers || {} };
  let body;
  if (s.http.body !== void 0 && s.http.body !== null) {
    if (typeof s.http.body === "string") body = s.http.body;
    else {
      body = JSON.stringify(s.http.body);
      if (!headers["content-type"]) headers["content-type"] = "application/json";
    }
  }
  const timeoutMs = Number(process.env.STONEY_TIMEOUT_MS || 15e3);
  const retries = Number(process.env.STONEY_RETRIES || 2);
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { method, headers, body }, timeoutMs);
      const status = res.status;
      const text = await res.text();
      let json;
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
      if (exp.json !== void 0) {
        if (json === void 0) {
          ok = false;
          notes.push("Expected JSON subset match, but response was not JSON.");
        } else if (!deepSubsetMatch(json, exp.json)) {
          ok = false;
          notes.push("Expected JSON subset did not match response JSON.");
        }
      }
      return { id: s.id, ok, method, url, status, notes };
    } catch (e) {
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
    notes: [`Network/timeout error: ${lastErr?.message || String(lastErr)}`]
  };
}

// src/cli.ts
var program = new Command();
program.name("stoney").description("Stoney \u2014 run HTTP contracts in CI.").version("0.0.1");
program.command("hello").action(() => console.log("\u{1FAA8} Stoney is alive."));
program.command("parse").argument("<file>", "Suite file (.yml/.yaml or .json)").option("--pretty", "Pretty-print JSON").action((file, opts) => {
  const suite = loadSuite(file);
  console.log(opts.pretty ? JSON.stringify(suite, null, 2) : JSON.stringify(suite));
});
program.command("run").requiredOption("--suite <glob>", "Suite file path or glob (e.g. contracts/*.yml)").option("--base-url <url>", "Base URL (defaults to STONEY_BASE_URL env var)").option("--report <path>", "JSON report output path", "stoney-report.json").option("--only-contract <name>", "Run only one contract by name").option("--only-scenario <id>", "Run only one scenario id").option("--fail-fast", "Stop on first failure", false).action(async (opts) => {
  const baseUrl = opts.baseUrl || process.env.STONEY_BASE_URL;
  if (!baseUrl) {
    console.error("Missing base URL. Provide --base-url or set STONEY_BASE_URL.");
    process.exit(2);
  }
  const suitePaths = await fg(opts.suite);
  if (!suitePaths.length) {
    console.error(`No suite files matched: ${opts.suite}`);
    process.exit(2);
  }
  let failed = 0;
  let total = 0;
  const results = [];
  console.log(`
\u{1FAA8} Stoney run`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Suites: ${suitePaths.join(", ")}
`);
  for (const p of suitePaths) {
    const suite = loadSuite(p);
    for (const contract of suite.contracts) {
      if (opts.onlyContract && contract.name !== opts.onlyContract) continue;
      console.log(`Suite: ${suite.suite}  Contract: ${contract.name}`);
      for (const scenario of contract.scenarios) {
        if (opts.onlyScenario && scenario.id !== opts.onlyScenario) continue;
        total++;
        const r = await runScenarioHttp(baseUrl, scenario);
        results.push({ suite: suite.suite, contract: contract.name, ...r });
        if (r.ok) {
          console.log(`  \u2705 ${scenario.id} (${r.status ?? "?"})`);
        } else {
          failed++;
          console.log(`  \u274C ${scenario.id} (${r.status ?? "?"})`);
          console.log(`     ${r.method} ${r.url}`);
          for (const n of r.notes) console.log(`     - ${n}`);
          if (opts.failFast) break;
        }
      }
      console.log("");
      if (opts.failFast && failed > 0) break;
    }
    if (opts.failFast && failed > 0) break;
  }
  const report = {
    baseUrl,
    suites: suitePaths,
    total,
    failed,
    passed: total - failed,
    ok: failed === 0,
    results
  };
  const out = path2.resolve(process.cwd(), opts.report);
  fs2.writeFileSync(out, JSON.stringify(report, null, 2), "utf8");
  console.log(`Report written: ${out}`);
  process.exit(failed === 0 ? 0 : 1);
});
program.parse(process.argv);
