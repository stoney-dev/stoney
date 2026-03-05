#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import fg from "fast-glob";
import { Command } from "commander";
import { fileURLToPath } from "node:url";

import { runSqlStep } from "./sql.js";
import { loadSuite } from "./contract.js";
import type { SuiteFileV1, Step, Check } from "./schema.js";
import type { ScenarioResult, StepResult } from "./types.js";
import { runHttpStep } from "./http.js";
import { runExecStep } from "./exec.js";
import type { TelemetryEnvelope } from "@stoney-dev/shared/telemetry";

const program = new Command();

function readVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // In dist bundle, this file lives in packages/runner/dist/cli.cjs
    // package.json is at packages/runner/package.json
    const pkgPath = path.resolve(__dirname, "../package.json");
    const raw = fs.readFileSync(pkgPath, "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function envFlag(name: string): boolean {
  const v = String(process.env[name] || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function didUserPassFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag);
}

function fatal(msg: string, code = 2): never {
  console.error(msg);
  process.exit(code);
}

function safeRegex(pat: string): RegExp | null {
  try {
    return new RegExp(pat);
  } catch {
    return null;
  }
}

function normalizeBaseUrl(u: string): string {
  return u.replace(/\/+$/, "");
}

/**
 * A stable install-ish id so you can count unique usage without asking users for anything.
 * - In GitHub, use owner/repo as the stable key (one “installation” per repo).
 * - Locally, store a random id in ~/.stoney/telemetry-id so it stays stable on that machine.
 */
function getInstallationId(): string {
  const repo = String(process.env.GITHUB_REPOSITORY || "").trim();
  if (repo) return `gh:${repo.toLowerCase()}`;

  try {
    const home = process.env.HOME || process.env.USERPROFILE;
    if (!home) return `local:${crypto.randomUUID()}`;

    const dir = path.join(home, ".stoney");
    const file = path.join(dir, "telemetry-id");

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(file)) {
      const existing = fs.readFileSync(file, "utf8").trim();
      if (existing) return `local:${existing}`;
    }

    const id = crypto.randomUUID();
    fs.writeFileSync(file, id, "utf8");
    return `local:${id}`;
  } catch {
    return `local:${crypto.randomUUID()}`;
  }
}

function makeAnonUserId(): string | null {
  // Optional: allow an explicit anon user id (e.g., action sets it)
  const v = String(process.env.STONEY_USER_ID || "").trim();
  return v ? v : null;
}

async function sendTelemetry(report: any, apiUrl: string, token: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const version = readVersion();
  const installation_id = getInstallationId();
  const anon_user_id = makeAnonUserId();

  const repo_id = String(process.env.GITHUB_REPOSITORY || "unknown");
  const run_id = String(process.env.GITHUB_RUN_ID || "");
  const workflow = String(process.env.GITHUB_WORKFLOW || "");
  const actor = String(process.env.GITHUB_ACTOR || "");
  const event_name = String(process.env.GITHUB_EVENT_NAME || "");

  // Minimal env signal (no secrets)
  const environment = repo_id !== "unknown" ? "github" : "local";

  // Put *your* analytics fields in metadata so you don’t have to change DB columns.
  const metadata = {
    kind: "stoney_run",
    version,
    installation_id,
    anon_user_id,
    environment,
    repo_id,
    run_id,
    workflow,
    actor,
    event_name,
    // Keep your original full report for debugging/UX
    report,
  };

  const payload: TelemetryEnvelope = {
    repo_id,
    status: report?.ok ? "pass" : "fail",
    metadata,
  };

  try {
    const endpoint = `${normalizeBaseUrl(apiUrl)}/api/telemetry`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        // Optional, but nice for server-side debugging:
        "User-Agent": `stoney/${version}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Telemetry HTTP ${response.status}`);
    console.log("📡 Telemetry sent successfully.");
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.warn("⚠️  Stoney telemetry timed out (5s limit).");
    } else {
      console.warn("⚠️  Stoney telemetry failed:", err?.message || String(err));
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

async function runOneStep(baseUrl: string, st: Step): Promise<StepResult> {
  if ("http" in st) {
    if (!baseUrl) {
      return {
        ok: false,
        kind: "http",
        title: `http ${st.http.method} ${st.http.path}`,
        notes: ["Missing base_url."],
      };
    }
    return runHttpStep(baseUrl, st.http, st.expect);
  }
  if ("exec" in st) return runExecStep(st.exec, st.expect);
  if ("sql" in st) return runSqlStep(st.sql, st.expect);
  return { ok: false, kind: "exec", title: "unknown", notes: ["Unknown step type."] };
}

program.name("stoney").description("Stoney — run contracts in CI.").version(readVersion());
program.command("hello").action(() => console.log("🪨 Stoney is alive."));

program
  .command("parse")
  .argument("<file>", "Contract file (.yml/.yaml or .json)")
  .option("--pretty", "Pretty-print JSON")
  .action((file: string, opts: any) => {
    const suite = loadSuite(file);
    console.log(opts.pretty ? JSON.stringify(suite, null, 2) : JSON.stringify(suite));
  });

program
  .command("run")
  .requiredOption("--suite <glob>", "Contract file path or glob (e.g. contracts/*.yml)")
  .option("--base-url <url>", "Base URL (defaults to STONEY_BASE_URL env var)")
  .option("--report <path>", "JSON report output path", "stoney-report.json")
  .option("--only-contract <name>", "Run only one contract by name")
  .option("--only-check <id>", "Run only one check id")
  .option("--fail-fast", "Stop on first failure", false)
  .option("--require-work-item", "Require work_item on every check (no integrations)", false)
  .option("--work-item-pattern <regex>", "Optional regex that work_item must match (e.g. '^KAN-\\\\d+$')")
  .action(async (opts: any) => {
    const baseUrl = String(opts.baseUrl || process.env.STONEY_BASE_URL || "").trim();
    const argv = process.argv.slice(2);

    const userSpecified = didUserPassFlag(argv, "--require-work-item");
    const requireWorkItem = userSpecified ? Boolean(opts.requireWorkItem) : envFlag("STONEY_REQUIRE_WORK_ITEM");

    const patternRaw = String(opts.workItemPattern || process.env.STONEY_WORK_ITEM_PATTERN || "").trim();
    const pattern = patternRaw ? safeRegex(patternRaw) : null;

    if (patternRaw && !pattern) fatal(`Invalid --work-item-pattern regex: ${patternRaw}`);

    const suitePaths = await fg(opts.suite, { onlyFiles: true, unique: true });
    if (!suitePaths.length) fatal(`No contract files matched: ${opts.suite}`);

    const suites: SuiteFileV1[] = [];
    for (const p of suitePaths) {
      try {
        suites.push(loadSuite(p));
      } catch (e: any) {
        fatal(`Contract parse error in "${p}": ${e?.message || String(e)}`);
      }
    }

    let failed = 0;
    let total = 0;
    const results: Array<{ feature: string; contract: string } & ScenarioResult> = [];

    console.log(`\n🪨 Stoney run`);
    console.log(`base_url: ${baseUrl ? baseUrl : "(not set)"}`);
    console.log(`Files loaded: ${suites.length}`);
    console.log("");

    let shouldStop = false;

    for (const suite of suites) {
      if (shouldStop) break;

      for (const contract of suite.contracts) {
        if (shouldStop) break;
        if (opts.onlyContract && contract.name !== opts.onlyContract) continue;

        for (const check of contract.checks as unknown as Check[]) {
          if (shouldStop) break;
          if (opts.onlyCheck && check.id !== opts.onlyCheck) continue;

          total++;
          let checkOk = true;
          const notes: string[] = [];
          const stepResults: StepResult[] = [];

          if (requireWorkItem) {
            const key = String(check.work_item || "").trim();
            if (!key) {
              checkOk = false;
              notes.push(`Missing work_item.`);
            } else if (pattern && !pattern.test(key)) {
              checkOk = false;
              notes.push(`work_item pattern mismatch.`);
            }
          }

          let method: string | undefined;
          let url: string | undefined;
          let status: number | undefined;

          if (checkOk) {
            if (!Array.isArray(check.steps) || check.steps.length === 0) {
              checkOk = false;
              notes.push("Check has no steps.");
            } else {
              for (const st of check.steps) {
                const r = await runOneStep(baseUrl, st);
                stepResults.push(r);
                if (r.kind === "http" && r.method && r.url) {
                  method = r.method;
                  url = r.url;
                  status = r.status;
                }
                if (!r.ok) {
                  checkOk = false;
                  if (opts.failFast) break;
                }
              }
            }
          }

          results.push({
            feature: suite.feature,
            contract: contract.name,
            id: check.id,
            ok: checkOk,
            work_item: check.work_item ? { key: check.work_item, says: check.says, links: check.links } : undefined,
            method,
            url,
            status,
            notes,
            steps: stepResults,
          });

          if (!checkOk) failed++;
          if (opts.failFast && !checkOk) shouldStop = true;
        }
      }
    }

    const report = {
      report_version: 1,
      base_url: baseUrl,
      total,
      failed,
      passed: Math.max(0, total - failed),
      ok: failed === 0,
      results,
    };

    const out = path.resolve(process.cwd(), opts.report);
    fs.writeFileSync(out, JSON.stringify(report, null, 2), "utf8");
    console.log(`Report written: ${out}`);

    // --- TELEMETRY ---
    const apiUrl = String(process.env.STONEY_API_URL || "").trim();
    const apiToken = String(process.env.STONEY_API_TOKEN || "").trim();
    if (apiUrl && apiToken) {
      await sendTelemetry(report, apiUrl, apiToken);
    }

    process.exit(failed === 0 ? 0 : 1);
  });

program
  .command("init")
  .description("Initialize Stoney in your project (creates a sample contract)")
  .action(() => {
    const dir = ".stoney";
    const filePath = path.join(dir, "example.yml");

    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    if (fs.existsSync(filePath)) {
      console.log(`⚠️  File already exists: ${filePath}`);
      return;
    }

    const template = `# yaml-language-server: $schema=https://stoneydev.com/schema.json
version: 1
feature: "Stoney Health Check"
description: "Verify core infrastructure"
contracts:
  - name: "API Smoke Test"
    description: "Check if the API is responding"
    checks:
      - id: "health-check"
        says: "API should return 200"
        steps:
          - http:
              method: "GET"
              path: "/health"
            expect:
              status: 200
`;

    fs.writeFileSync(filePath, template, "utf8");
    console.log(`✅ Initialized Stoney!`);
    console.log(`   Created: ${filePath}`);
  });

program.parse(process.argv);