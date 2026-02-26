#!/usr/bin/env node
// packages/runner/src/cli.ts
import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { Command } from "commander";
import { loadSuite, type SuiteFileV1, type Step, type Check } from "./contract.js";
import { runHttpStep } from "./http.js";
import { runExecStep } from "./exec.js";
import { runSqlStep } from "./sql.js";
import type { ScenarioResult, StepResult } from "./types.js";

const program = new Command();

program.name("stoney").description("Stoney — run contracts in CI.").version("0.0.1");
program.command("hello").action(() => console.log("🪨 Stoney is alive."));

program
  .command("parse")
  .argument("<file>", "Contract file (.yml/.yaml or .json)")
  .option("--pretty", "Pretty-print JSON")
  .action((file: string, opts: any) => {
    const suite = loadSuite(file);
    console.log(opts.pretty ? JSON.stringify(suite, null, 2) : JSON.stringify(suite));
  });

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

    // Precedence:
    // - If user passed --require-work-item explicitly, honor that.
    // - Else fall back to STONEY_REQUIRE_WORK_ITEM.
    const userSpecified = didUserPassFlag(argv, "--require-work-item");
    const requireWorkItem = userSpecified ? Boolean(opts.requireWorkItem) : envFlag("STONEY_REQUIRE_WORK_ITEM");

    // Pattern:
    // - CLI flag wins
    // - else env
    const patternRaw = String(opts.workItemPattern || process.env.STONEY_WORK_ITEM_PATTERN || "").trim();
    const pattern = patternRaw ? safeRegex(patternRaw) : null;

    if (patternRaw && !pattern) {
      fatal(`Invalid --work-item-pattern regex: ${patternRaw}`);
    }

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
    if (requireWorkItem) console.log(`work_item required: ON${pattern ? ` (pattern: ${patternRaw})` : ""}`);
    if (opts.failFast) console.log(`fail_fast: ON`);
    console.log("");

    let shouldStop = false;

    for (const suite of suites) {
      if (shouldStop) break;

      console.log(`Feature: ${suite.feature}`);
      if (suite.description) console.log(`  ${suite.description}`);
      console.log("");

      for (const contract of suite.contracts) {
        if (shouldStop) break;
        if (opts.onlyContract && contract.name !== opts.onlyContract) continue;

        console.log(`Contract: ${contract.name}`);
        if (contract.description) console.log(`  ${contract.description}`);

        for (const check of contract.checks as unknown as Check[]) {
          if (shouldStop) break;
          if (opts.onlyCheck && check.id !== opts.onlyCheck) continue;

          total++;

          let checkOk = true;
          const notes: string[] = [];
          const stepResults: StepResult[] = [];

          // v1 policy: enforce presence (and optional pattern) only
          if (requireWorkItem) {
            const key = String(check.work_item || "").trim();
            if (!key) {
              checkOk = false;
              notes.push(`Missing work_item (required). Add: work_item: "KAN-123".`);
            } else if (pattern && !pattern.test(key)) {
              checkOk = false;
              notes.push(`work_item did not match required pattern: ${patternRaw}`);
            }
          }

          let method: string | undefined;
          let url: string | undefined;
          let status: number | undefined;

          // If policy already failed, still record result but do not run steps.
          if (checkOk) {
            if (!Array.isArray(check.steps) || check.steps.length === 0) {
              checkOk = false;
              notes.push("Check has no steps (steps[]).");
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

          const row: ScenarioResult = {
            id: check.id,
            ok: checkOk,
            work_item: check.work_item
              ? { key: check.work_item, says: check.says, links: check.links }
              : undefined,
            method,
            url,
            status,
            notes,
            steps: stepResults,
          };

          results.push({ feature: suite.feature, contract: contract.name, ...row });

          if (checkOk) {
            console.log(`  ✅ ${check.id}`);
          } else {
            failed++;
            console.log(`  ❌ ${check.id}`);
            for (const n of notes) console.log(`     - ${n}`);

            const badSteps = stepResults.filter((x) => !x.ok);
            for (const sr of badSteps) {
              console.log(`     ${sr.title}`);
              for (const n of sr.notes) console.log(`     - ${n}`);
            }

            if (opts.failFast) {
              console.log(`\n⛔ fail-fast enabled — stopping after first failure.\n`);
              shouldStop = true;
            }
          }
        }

        console.log("");
      }
    }

    const passed = Math.max(0, total - failed);

    const report = {
      report_version: 1 as const,
      contract_version: 1 as const,
      base_url: baseUrl,
      total,
      failed,
      passed,
      ok: failed === 0,
      results,
    };

    const out = path.resolve(process.cwd(), opts.report);
    fs.writeFileSync(out, JSON.stringify(report, null, 2), "utf8");
    console.log(`Report written: ${out}`);

    process.exit(failed === 0 ? 0 : 1);
  });

program.parse(process.argv);