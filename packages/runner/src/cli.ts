#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import fg from "fast-glob";
import { Command, CommanderError } from "commander";
import { fileURLToPath } from "node:url";

import { runSqlStep } from "./sql.js";
import { loadSuite } from "./contract.js";
import type { SuiteFileV1, Step, Check } from "./schema.js";
import type { ScenarioResult, StepResult, WorkItemRef } from "./types.js";
import { runHttpStep } from "./http.js";
import { runExecStep } from "./exec.js";
import type { TelemetryEnvelope } from "./telemetry.js";

const program = new Command();
const TELEMETRY_ENDPOINT = "https://stoneydev.com/api/telemetry";

// Catch any unhandled promise rejection that Commander drops on the floor
// and surface it as a visible error with a non-zero exit code.
process.on("unhandledRejection", (reason: unknown) => {
  const message = reason instanceof Error ? reason.stack || reason.message : String(reason);
  console.error(`❌ Unhandled rejection in Stoney CLI:\n${message}`);
  process.exit(2);
});

process.on("uncaughtException", (err: Error) => {
  console.error(`❌ Uncaught exception in Stoney CLI:\n${err.stack || err.message}`);
  process.exit(2);
});

function readVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
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

function telemetryDebugEnabled(): boolean {
  const v = String(process.env.STONEY_DEBUG_TELEMETRY || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

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
  const v = String(process.env.STONEY_USER_ID || "").trim();
  return v ? v : null;
}

async function sendTelemetry(report: unknown): Promise<void> {
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
  const environment = repo_id !== "unknown" ? "github" : "local";

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
    report,
  };

  const payload: TelemetryEnvelope = {
    repo_id,
    status: (report as { ok?: boolean })?.ok ? "pass" : "fail",
    metadata,
  };

  try {
    const response = await fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": `stoney/${version}`,
        "X-Stoney-Installation": installation_id,
        "X-Stoney-Env": environment,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok && telemetryDebugEnabled()) {
      console.warn(`⚠️  Stoney telemetry failed: HTTP ${response.status}`);
    }
  } catch (err: any) {
    if (telemetryDebugEnabled()) {
      console.warn("⚠️  Stoney telemetry failed:", err?.message || String(err));
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

async function runOneStep(baseUrl: string, st: Step): Promise<StepResult> {
  try {
    if ("http" in st) {
      if (!baseUrl) {
        return {
          ok: false,
          kind: "http",
          title: `http ${st.http.method} ${st.http.path}`,
          notes: ["Missing base_url."],
        };
      }
      return await runHttpStep(baseUrl, st.http, st.expect);
    }

    if ("exec" in st) return await runExecStep(st.exec, st.expect);
    if ("sql" in st) return await runSqlStep(st.sql, st.expect);

    return {
      ok: false,
      kind: "exec",
      title: "unknown",
      notes: ["Unknown step type."],
    };
  } catch (err: any) {
    // Surface step-level errors as failed step results rather than letting
    // them escape and silently kill the process with exit 0 + no report.
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? (err.stack ?? "") : "";
    console.error(`❌ Step threw unexpectedly: ${message}\n${stack}`);
    return {
      ok: false,
      kind: "exec",
      title: "step error",
      notes: [`Step threw: ${message}`],
    };
  }
}

function pickString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function pickStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = value.filter((x: unknown): x is string => typeof x === "string");
  return filtered.length ? filtered : undefined;
}

function normalizeWorkItem(
  workItem: unknown,
  fallbackSays?: unknown,
  fallbackLinks?: unknown
): WorkItemRef | undefined {
  if (typeof workItem === "string") {
    const key = workItem.trim();
    if (!key) return undefined;
    return {
      key,
      says: pickString(fallbackSays),
      links: pickStringArray(fallbackLinks),
    };
  }

  if (workItem && typeof workItem === "object") {
    const wi = workItem as { key?: unknown; says?: unknown; links?: unknown };
    const key = typeof wi.key === "string" ? wi.key.trim() : "";
    if (!key) return undefined;
    return {
      key,
      says: pickString(wi.says) ?? pickString(fallbackSays),
      links: pickStringArray(wi.links) ?? pickStringArray(fallbackLinks),
    };
  }

  return undefined;
}

program
  .name("stoney")
  .description("Stoney — run contracts in CI.")
  .version(readVersion())
  .exitOverride((err: CommanderError) => {
    if (err.code !== "commander.helpDisplayed" && err.code !== "commander.version") {
      console.error(`❌ Stoney CLI error: ${err.message}`);
    }
    process.exit(err.exitCode ?? 1);
  });

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
  .option("--base-url <url>", "Base URL")
  .option("--report <path>", "JSON report output path", "stoney-report.json")
  .option("--only-contract <name>", "Run only one contract by name")
  .option("--only-check <id>", "Run only one check id")
  .option("--fail-fast", "Stop on first failure", false)
  .option("--require-work-item", "Require work_item on every check", false)
  .option("--work-item-pattern <regex>", "Regex that work_item.key must match")
  .allowUnknownOption(false)
  .action(async (opts: any) => {
    // Wrap the entire action body so any throw — sync or async — is caught
    // and printed before exit, instead of being silently dropped by Commander.
    try {
      await runCommand(opts);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.stack || err.message : String(err);
      console.error(`❌ Stoney run failed with unhandled error:\n${message}`);
      process.exit(2);
    }
  });

async function runCommand(opts: any): Promise<void> {
  const baseUrl = String(opts.baseUrl || process.env.STONEY_BASE_URL || "").trim();
  const argv = process.argv.slice(2).filter((a) => a.trim() !== "");

  const userSpecifiedRequire = didUserPassFlag(argv, "--require-work-item");
  const requireWorkItem = userSpecifiedRequire
    ? Boolean(opts.requireWorkItem)
    : envFlag("STONEY_REQUIRE_WORK_ITEM");

  const patternRaw = String(opts.workItemPattern || process.env.STONEY_WORK_ITEM_PATTERN || "").trim();
  const pattern = patternRaw ? safeRegex(patternRaw) : null;

  if (patternRaw && !pattern) {
    fatal(`Invalid --work-item-pattern regex: ${patternRaw}`);
  }

  console.log(`🔍 Resolving suite glob: ${opts.suite} (cwd: ${process.cwd()})`);

  const suitePaths = await fg(opts.suite, { onlyFiles: true, unique: true });
  if (!suitePaths.length) {
    fatal(`No contract files matched: ${opts.suite}`);
  }

  console.log(`📋 Found ${suitePaths.length} contract file(s): ${suitePaths.join(", ")}`);

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
  let shouldStop = false;

  for (const suite of suites) {
    if (shouldStop) break;

    for (const contract of suite.contracts) {
      if (shouldStop) break;
      if (opts.onlyContract && contract.name !== opts.onlyContract) continue;

      for (const check of contract.checks as Check[]) {
        if (shouldStop) break;
        if (opts.onlyCheck && check.id !== opts.onlyCheck) continue;

        total++;

        let checkOk = true;
        const notes: string[] = [];
        const stepResults: StepResult[] = [];
        const normalizedWorkItem = normalizeWorkItem(check.work_item, check.says, check.links);
        const workItemKey = normalizedWorkItem?.key || "";

        if (requireWorkItem) {
          if (!workItemKey) {
            checkOk = false;
            notes.push("Missing work_item. Expected a work_item.key value.");
          } else if (pattern && !pattern.test(workItemKey)) {
            checkOk = false;
            notes.push(
              `work_item.key "${workItemKey}" does not match required pattern "${patternRaw}".`
            );
          }
        }

        if (checkOk) {
          if (!Array.isArray(check.steps) || check.steps.length === 0) {
            checkOk = false;
            notes.push("Check has no steps.");
          } else {
            for (const st of check.steps) {
              const r = await runOneStep(baseUrl, st);
              stepResults.push(r);

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
          work_item: normalizedWorkItem,
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
  console.log(`📝 Writing report to: ${out}`);

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(report, null, 2), "utf8");

  console.log(`✅ Report written (${report.total} checks, ${report.failed} failed)`);
  console.log("--- STONEY_REPORT_START ---");
  console.log(JSON.stringify(report));
  console.log("--- STONEY_REPORT_END ---");

  await sendTelemetry(report);

  process.exit(failed === 0 ? 0 : 1);
}

program.command("init").description("Initialize Stoney").action(() => {
  const dir = ".stoney";
  const filePath = path.join(dir, "example.yml");

  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  if (fs.existsSync(filePath)) return;

  fs.writeFileSync(
    filePath,
    `# yaml-language-server: $schema=https://stoneydev.com/schema.json`,
    "utf8"
  );
});

async function main(): Promise<void> {
  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.stack || err.message : String(err);
  fatal(message);
});