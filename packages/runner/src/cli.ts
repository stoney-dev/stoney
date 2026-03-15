#!/usr/bin/env node
import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import fg from "fast-glob";
import { Command, CommanderError } from "commander";
import { runSqlStep } from "./sql.js";
import { loadSuite } from "./contract.js";
import type { SuiteFileV1, Step, Check } from "./schema.js";
import type { ScenarioResult, StepResult, WorkItemRef } from "./types.js";
import { runHttpStep } from "./http.js";
import { runExecStep } from "./exec.js";
import type { TelemetryEnvelope } from "./telemetry.js";

const program = new Command();
const TELEMETRY_ENDPOINT = "https://stoneydev.com/api/telemetry";
const INGEST_ENDPOINT = "https://stoneydev.com/api/ingest";
const DEFAULT_SUITE = "contracts/*.yml";

// ─── ANSI colour helpers ──────────────────────────────────────────────────
// Colours are suppressed when stdout is not a TTY or NO_COLOR is set,
// following the https://no-color.org convention.

const isTTY =
  Boolean(process.stdout.isTTY) && process.env.NO_COLOR === undefined;

const c = {
  bold: (s: string) => (isTTY ? `\x1b[1m${s}\x1b[0m` : s),
  dim: (s: string) => (isTTY ? `\x1b[2m${s}\x1b[0m` : s),
  green: (s: string) => (isTTY ? `\x1b[32m${s}\x1b[0m` : s),
  red: (s: string) => (isTTY ? `\x1b[31m${s}\x1b[0m` : s),
  yellow: (s: string) => (isTTY ? `\x1b[33m${s}\x1b[0m` : s),
  cyan: (s: string) => (isTTY ? `\x1b[36m${s}\x1b[0m` : s),
  blue: (s: string) => (isTTY ? `\x1b[34m${s}\x1b[0m` : s),
  gray: (s: string) => (isTTY ? `\x1b[90m${s}\x1b[0m` : s),
};

// ─── Output primitives ────────────────────────────────────────────────────

const PASS = "✓";
const FAIL = "✗";
const WARN = "▲";
const DOT = "·";

function log(msg = "") {
  console.log(msg);
}
function out(msg: string) {
  console.error(msg);
} // stderr for errors/warns
function blank() {
  console.log("");
}

function header(title: string) {
  blank();
  if (isTTY) {
    const width = Math.min(60, process.stdout.columns ?? 60);
    log(c.bold(c.cyan(title)));
    log(c.dim("─".repeat(width)));
  } else {
    log(`=== ${title} ===`);
  }
  blank();
}

function passLine(msg: string) {
  log(`  ${c.green(PASS)}  ${msg}`);
}
function failLine(msg: string) {
  out(`  ${c.red(FAIL)}  ${msg}`);
}
function warnLine(msg: string) {
  log(`  ${c.yellow(WARN)}  ${msg}`);
}
function infoLine(msg: string) {
  log(`  ${c.gray(DOT)}  ${c.dim(msg)}`);
}
function noteLine(msg: string) {
  log(`       ${c.dim(msg)}`);
}
function indentErr(msg: string) {
  out(`       ${msg}`);
}

function fatal(msg: string, code = 2): never {
  blank();
  out(`  ${c.red(FAIL)}  ${c.bold("Error:")} ${msg}`);
  blank();
  process.exit(code);
}

// ─── Process-level guards ─────────────────────────────────────────────────

process.on("unhandledRejection", (reason: unknown) => {
  const msg =
    reason instanceof Error ? reason.stack || reason.message : String(reason);
  out(`\n  ${c.red(FAIL)}  ${c.bold("Unhandled error")}\n\n${c.dim(msg)}\n`);
  process.exit(2);
});

process.on("uncaughtException", (e: Error) => {
  out(
    `\n  ${c.red(FAIL)}  ${c.bold("Uncaught exception")}\n\n${c.dim(
      e.stack || e.message
    )}\n`
  );
  process.exit(2);
});

// ─── Misc helpers ─────────────────────────────────────────────────────────

function readVersion(): string {
  try {
    const pkgPath = path.resolve(__dirname, "../package.json");
    const raw = fs.readFileSync(pkgPath, "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function envFlag(name: string): boolean {
  const v = String(process.env[name] || "")
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function didUserPassFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag);
}

function safeRegex(pat: string): RegExp | null {
  try {
    return new RegExp(pat);
  } catch {
    return null;
  }
}

function telemetryDebugEnabled(): boolean {
  return envFlag("STONEY_DEBUG_TELEMETRY");
}

function formatMs(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
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
      const id = fs.readFileSync(file, "utf8").trim();
      if (id) return `local:${id}`;
    }
    const id = crypto.randomUUID();
    fs.writeFileSync(file, id, "utf8");
    return `local:${id}`;
  } catch {
    return `local:${crypto.randomUUID()}`;
  }
}

// ─── Telemetry ────────────────────────────────────────────────────────────

async function sendTelemetry(report: unknown): Promise<void> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 5000);
  const version = readVersion();
  const installation_id = getInstallationId();
  const repo_id = String(process.env.GITHUB_REPOSITORY || "unknown");
  const environment = repo_id !== "unknown" ? "github" : "local";

  const payload: TelemetryEnvelope = {
    repo_id,
    status: (report as { ok?: boolean })?.ok ? "pass" : "fail",
    metadata: {
      kind: "stoney_run",
      version,
      installation_id,
      environment,
      repo_id,
      run_id: String(process.env.GITHUB_RUN_ID || ""),
      workflow: String(process.env.GITHUB_WORKFLOW || ""),
      actor: String(process.env.GITHUB_ACTOR || ""),
      event_name: String(process.env.GITHUB_EVENT_NAME || ""),
      report,
    },
  };

  try {
    const res = await fetch(TELEMETRY_ENDPOINT, {
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
    if (!res.ok && telemetryDebugEnabled())
      warnLine(`Telemetry: HTTP ${res.status}`);
  } catch (e: any) {
    if (telemetryDebugEnabled()) warnLine(`Telemetry error: ${e?.message}`);
  } finally {
    clearTimeout(tid);
  }
}

// ─── Dashboard push ───────────────────────────────────────────────────────

async function pushToDashboard(report: unknown, token: string): Promise<void> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 10000);
  const version = readVersion();
  const repo_id = String(process.env.GITHUB_REPOSITORY || "unknown");
  const run_id = String(process.env.GITHUB_RUN_ID || "");

  try {
    const res = await fetch(INGEST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": `stoney/${version}`,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        repo_id,
        git_sha: String(process.env.GITHUB_SHA || ""),
        git_ref: String(process.env.GITHUB_REF || ""),
        run_id,
        run_url: run_id
          ? `https://github.com/${repo_id}/actions/runs/${run_id}`
          : "",
        actor: String(process.env.GITHUB_ACTOR || ""),
        event_name: String(process.env.GITHUB_EVENT_NAME || ""),
        report,
      }),
      signal: controller.signal,
    });

    if (res.ok) {
      passLine(`${c.bold("Dashboard")} synced  ${c.dim("→ stoneydev.com")}`);
    } else if (res.status === 401) {
      warnLine(
        `Dashboard sync failed: invalid ${c.bold(
          "STONEY_TOKEN"
        )} — check your .env or repo secret`
      );
    } else {
      warnLine(`Dashboard sync failed: HTTP ${res.status}`);
    }
  } catch (e: any) {
    warnLine(`Dashboard sync error: ${e?.message || String(e)}`);
  } finally {
    clearTimeout(tid);
  }
}

// ─── Step runner ──────────────────────────────────────────────────────────

async function runOneStep(baseUrl: string, st: Step): Promise<StepResult> {
  try {
    if ("http" in st) {
      if (!baseUrl) {
        return {
          ok: false,
          kind: "http",
          title: `${st.http.method} ${st.http.path}`,
          notes: [
            "No base URL — set STONEY_BASE_URL in .env or pass --base-url",
          ],
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
      notes: ["Unknown step type"],
    };
  } catch (e: any) {
    return {
      ok: false,
      kind: "exec",
      title: "step error",
      notes: [`Threw: ${e?.message || String(e)}`],
    };
  }
}

// ─── Work item helpers ────────────────────────────────────────────────────

function pickString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function pickStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const r = v.filter((x): x is string => typeof x === "string");
  return r.length ? r : undefined;
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

// ─── CLI definition ───────────────────────────────────────────────────────

program
  .name("stoney")
  .description("Stoney — Requirements-as-Code CI runner")
  .version(readVersion(), "-v, --version")
  .exitOverride((e: CommanderError) => {
    if (
      e.code !== "commander.helpDisplayed" &&
      e.code !== "commander.version"
    ) {
      out(`\n  ${c.red(FAIL)}  ${e.message}\n`);
    }
    process.exit(e.exitCode ?? 1);
  });

// hello ────────────────────────────────────────────────────────────────────

program
  .command("hello")
  .description("Smoke test — confirms the CLI is installed correctly")
  .action(() => {
    blank();
    log(
      `  🪨  ${c.bold("Stoney")} ${c.dim(`v${readVersion()}`)}  ${c.green(
        "is alive"
      )}`
    );
    blank();
  });

// parse ────────────────────────────────────────────────────────────────────

program
  .command("parse")
  .argument("<file>", "Contract file (.yml / .yaml / .json)")
  .option("--pretty", "Pretty-print JSON output")
  .description("Parse and print a contract file as JSON")
  .action((file: string, opts: any) => {
    const suite = loadSuite(file);
    log(opts.pretty ? JSON.stringify(suite, null, 2) : JSON.stringify(suite));
  });

// validate ─────────────────────────────────────────────────────────────────

program
  .command("validate")
  .description("Parse and schema-validate contracts without running them")
  .option("--suite <glob>", "Contract glob", DEFAULT_SUITE)
  .action(async (opts: any) => {
    header("Validating contracts");

    const suitePaths = await fg(opts.suite, { onlyFiles: true, unique: true });
    if (!suitePaths.length)
      fatal(`No contract files matched: ${c.bold(opts.suite)}`);

    infoLine(`glob   ${opts.suite}`);
    infoLine(`files  ${suitePaths.length}`);
    blank();

    let hasErrors = false;

    for (const p of suitePaths) {
      try {
        const suite = loadSuite(p);
        const cc = suite.contracts.length;
        const chk = suite.contracts.reduce((n, x) => n + x.checks.length, 0);
        passLine(
          `${c.bold(p)}  ${c.dim(
            `${cc} contract${cc === 1 ? "" : "s"}, ${chk} check${
              chk === 1 ? "" : "s"
            }`
          )}`
        );
      } catch (e: any) {
        failLine(c.bold(p));
        indentErr(c.yellow(e?.message || String(e)));
        hasErrors = true;
      }
    }

    blank();

    if (hasErrors) {
      out(
        `  ${c.red(FAIL)}  ${c.bold(
          "Validation failed"
        )} — fix the errors above before running`
      );
      blank();
      process.exit(1);
    }

    log(`  ${c.green(PASS)}  ${c.bold("All contracts valid")}`);
    blank();
  });

// run ──────────────────────────────────────────────────────────────────────

program
  .command("run")
  .description("Run contracts and fail CI on drift")
  .option("--suite <glob>", "Contract file path or glob", DEFAULT_SUITE)
  .option("--base-url <url>", "Base URL for HTTP steps (or STONEY_BASE_URL)")
  .option("--report <path>", "JSON report output path", "stoney-report.json")
  .option("--only-contract <name>", "Run only one contract by name")
  .option("--only-check <id>", "Run only one check by id")
  .option("--fail-fast", "Stop on first failure", false)
  .option("--require-work-item", "Require work_item on every check", false)
  .option("--work-item-pattern <regex>", "Regex that work_item.key must match")
  .allowUnknownOption(false)
  .action(async (opts: any) => {
    try {
      await runCommand(opts);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.stack || e.message : String(e);
      out(
        `\n  ${c.red(FAIL)}  ${c.bold("Unexpected error")}\n\n${c.dim(msg)}\n`
      );
      process.exit(2);
    }
  });

async function runCommand(opts: any): Promise<void> {
  const runStart = Date.now();
  const baseUrl = String(
    opts.baseUrl || process.env.STONEY_BASE_URL || ""
  ).trim();
  const argv = process.argv.slice(2).filter((a) => a.trim() !== "");

  const requireWorkItem = didUserPassFlag(argv, "--require-work-item")
    ? Boolean(opts.requireWorkItem)
    : envFlag("STONEY_REQUIRE_WORK_ITEM");

  const patternRaw = String(
    opts.workItemPattern || process.env.STONEY_WORK_ITEM_PATTERN || ""
  ).trim();
  const pattern = patternRaw ? safeRegex(patternRaw) : null;
  if (patternRaw && !pattern)
    fatal(`Invalid --work-item-pattern regex: ${c.bold(patternRaw)}`);

  // Resolve files
  header("Running contracts");

  const suitePaths = await fg(opts.suite, { onlyFiles: true, unique: true });
  if (!suitePaths.length)
    fatal(`No contract files matched: ${c.bold(opts.suite)}`);

  infoLine(`glob   ${opts.suite}`);
  infoLine(`files  ${suitePaths.length}  ${c.gray(suitePaths.join(", "))}`);
  if (baseUrl) infoLine(`url    ${baseUrl}`);
  blank();

  const suites: SuiteFileV1[] = [];
  for (const p of suitePaths) {
    try {
      suites.push(loadSuite(p));
    } catch (e: any) {
      fatal(`Parse error in ${c.bold(p)}: ${e?.message || String(e)}`);
    }
  }

  // Execute
  let failed = 0;
  let total = 0;
  let shouldStop = false;
  const results: Array<{ feature: string; contract: string } & ScenarioResult> =
    [];

  for (const suite of suites) {
    if (shouldStop) break;

    for (const contract of suite.contracts) {
      if (shouldStop) break;
      if (opts.onlyContract && contract.name !== opts.onlyContract) continue;

      log(
        `  ${c.bold(c.blue(contract.name))}${
          contract.description ? c.dim(`  ${contract.description}`) : ""
        }`
      );

      for (const check of contract.checks as Check[]) {
        if (shouldStop) break;
        if (opts.onlyCheck && check.id !== opts.onlyCheck) continue;

        total++;
        const checkStart = Date.now();
        let checkOk = true;
        const notes: string[] = [];
        const stepResults: StepResult[] = [];
        const wi = normalizeWorkItem(check.work_item, check.says, check.links);
        const wiKey = wi?.key || "";

        // Work item enforcement
        if (requireWorkItem) {
          if (!wiKey) {
            checkOk = false;
            notes.push("Missing work_item — expected a work_item.key value");
          } else if (pattern && !pattern.test(wiKey)) {
            checkOk = false;
            notes.push(
              `work_item.key "${wiKey}" does not match pattern "${patternRaw}"`
            );
          }
        }

        // Run steps
        if (checkOk) {
          if (!Array.isArray(check.steps) || check.steps.length === 0) {
            checkOk = false;
            notes.push("Check has no steps");
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

        // Print result
        const dur = c.dim(` ${formatMs(Date.now() - checkStart)}`);
        const tag = wiKey ? `  ${c.dim(`[${wiKey}]`)}` : "";

        if (checkOk) {
          log(`    ${c.green(PASS)}  ${check.id}${tag}${dur}`);
          if (check.says) noteLine(check.says);
        } else {
          out(`    ${c.red(FAIL)}  ${c.bold(check.id)}${tag}${dur}`);
          if (check.says) indentErr(c.dim(check.says));
          for (const n of notes) indentErr(c.yellow(n));
          for (const sr of stepResults.filter((s) => !s.ok)) {
            indentErr(`${c.dim("step")}  ${sr.title}`);
            for (const n of sr.notes || []) indentErr(`  ${c.red("↳")} ${n}`);
          }
        }

        results.push({
          feature: suite.feature,
          contract: contract.name,
          id: check.id,
          ok: checkOk,
          work_item: wi,
          notes,
          steps: stepResults,
        });

        if (!checkOk) failed++;
        if (opts.failFast && !checkOk) shouldStop = true;
      }

      blank();
    }
  }

  // Summary line
  const elapsed = Date.now() - runStart;
  const passed = Math.max(0, total - failed);
  const parts = [
    failed === 0 ? c.green(`${passed} passed`) : c.red(`${failed} failed`),
    failed > 0 && passed > 0 ? c.dim(`${passed} passed`) : "",
    c.dim(`${total} total`),
    c.dim(formatMs(elapsed)),
  ]
    .filter(Boolean)
    .join(c.dim("  ·  "));

  if (failed === 0) {
    log(
      `  ${c.green(PASS)}  ${c.bold("All checks passed")}  ${c.dim(
        "·"
      )}  ${parts}`
    );
  } else {
    out(
      `  ${c.red(FAIL)}  ${c.bold(
        `${failed} check${failed === 1 ? "" : "s"} failed`
      )}  ${c.dim("·")}  ${parts}`
    );
  }

  blank();

  // Write report
  const report = {
    report_version: 1,
    base_url: baseUrl,
    total,
    failed,
    passed,
    ok: failed === 0,
    duration_ms: elapsed,
    results,
  };

  const out2 = path.resolve(process.cwd(), opts.report);
  fs.mkdirSync(path.dirname(out2), { recursive: true });
  fs.writeFileSync(out2, JSON.stringify(report, null, 2), "utf8");
  infoLine(`report  ${path.relative(process.cwd(), out2)}`);
  blank();

  // Machine-readable marker consumed by GitHub Action
  console.log("--- STONEY_REPORT_START ---");
  console.log(JSON.stringify(report));
  console.log("--- STONEY_REPORT_END ---");

  // Post-run hooks — never block CI
  await sendTelemetry(report);
  const stoneyToken = String(process.env.STONEY_TOKEN || "").trim();
  if (stoneyToken) await pushToDashboard(report, stoneyToken);

  process.exit(failed === 0 ? 0 : 1);
}

// init ─────────────────────────────────────────────────────────────────────

program
  .command("init")
  .description("Scaffold a starter contract in contracts/")
  .action(() => {
    const dir = "contracts";
    const filePath = path.join(dir, "example.yml");

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(filePath)) {
      blank();
      warnLine(`${c.bold(filePath)} already exists — skipping`);
      noteLine("Delete it and re-run init to regenerate");
      blank();
      return;
    }

    const template = `# yaml-language-server: $schema=https://stoneydev.com/schema.json
    version: 1
    feature: demo
    description: Public Stoney demo contracts against stoneydev.com
    
    contracts:
      - name: health_endpoint
        description: Verify the public health endpoint is reachable and returns the expected shape.
        checks:
          - id: health_ok
            work_item: "KAN-123"
            says: "The health endpoint must return 200 and identify the service."
            steps:
              - http:
                  method: GET
                  path: /api/health
                expect:
                  status: 200
                  json:
                    ok: true
                    service: "stoney-web"
                    route: "/api/health"
    
      - name: auth_enforcement
        description: Verify protected routes reject unauthenticated requests.
        checks:
          - id: me_requires_auth
            work_item: "KAN-124"
            says: "Unauthenticated requests to /api/me must be rejected."
            steps:
              - http:
                  method: GET
                  path: /api/me
                expect:
                  status: 401
    `;

    fs.writeFileSync(filePath, template, "utf8");

    blank();
    log(`  ${c.green(PASS)}  ${c.bold("Created")} ${c.cyan(filePath)}`);
    blank();
    log(`  ${c.bold("Next steps")}`);
    blank();
    log(`    ${c.cyan("1")}  Edit ${c.bold(filePath)} to match your API`);
    log(
      `    ${c.cyan("2")}  Add ${c.bold(
        "STONEY_BASE_URL=http://localhost:3000"
      )} to ${c.bold(".env")}`
    );
    log(`    ${c.cyan("3")}  ${c.bold("stoney validate")}`);
    log(`    ${c.cyan("4")}  ${c.bold("stoney run")}`);
    blank();
  });

// ─── Entry ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  await program.parseAsync(process.argv);
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.stack || e.message : String(e);
  fatal(msg);
});
