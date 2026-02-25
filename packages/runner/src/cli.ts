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
import { jiraIssueExists } from "./jira.js";
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

async function runOneStep(baseUrl: string | undefined, st: Step): Promise<StepResult> {
  if ("http" in st) {
    if (!baseUrl) {
      return {
        ok: false,
        kind: "http",
        title: `http ${st.http.method} ${st.http.path}`,
        notes: ["Missing base URL. Provide --base-url or set STONEY_BASE_URL."],
      };
    }
    return runHttpStep(baseUrl, st.http, st.then);
  }
  if ("exec" in st) return runExecStep(st.exec, st.then);
  if ("sql" in st) return runSqlStep(st.sql, st.then);
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
  .option("--require-jira", "Require work_item and verify it exists in Jira (read-only)", false)
  .action(async (opts: any) => {
    const baseUrl = opts.baseUrl || process.env.STONEY_BASE_URL;
    const argv = process.argv.slice(2);

    const requireJira = didUserPassFlag(argv, "--require-jira") ? Boolean(opts.requireJira) : envFlag("STONEY_REQUIRE_JIRA");

    const suitePaths = await fg(opts.suite, { onlyFiles: true, unique: true });
    const suites: SuiteFileV1[] = [];
    for (const p of suitePaths) suites.push(loadSuite(p));

    if (!suites.length) {
      console.error(`No contract files matched: ${opts.suite}`);
      process.exit(2);
    }

    let failed = 0;
    let total = 0;
    const results: Array<{ feature: string; contract: string } & ScenarioResult> = [];

    console.log(`\n🪨 Stoney run`);
    if (baseUrl) console.log(`Base URL: ${baseUrl}`);
    console.log(`Files loaded: ${suites.length}`);
    if (requireJira) console.log(`Work items required: ON (Jira exists check)`);
    console.log("");

    for (const suite of suites) {
      console.log(`Feature: ${suite.feature}`);
      if (suite.description) console.log(`  ${suite.description}`);
      console.log("");

      for (const contract of suite.contracts) {
        if (opts.onlyContract && contract.name !== opts.onlyContract) continue;

        console.log(`Contract: ${contract.name}`);
        if (contract.description) console.log(`  ${contract.description}`);

        for (const check of contract.checks as unknown as Check[]) {
          if (opts.onlyCheck && check.id !== opts.onlyCheck) continue;

          total++;

          let checkOk = true;
          const notes: string[] = [];
          const stepResults: StepResult[] = [];

          // ✅ enforce Jira work item + existence
          if (requireJira) {
            const key = String(check.work_item || "").trim();
            if (!key) {
              checkOk = false;
              notes.push(`Missing work_item (required). Add: work_item: "KAN-123".`);
            } else {
              try {
                const chk = await jiraIssueExists(key);
                if (!chk.ok) {
                  checkOk = false;
                  notes.push(`Jira issue not found / not accessible: ${key} — ${chk.message || `status=${chk.status}`}`);
                }
              } catch (e: any) {
                checkOk = false;
                notes.push(`Jira validation error for ${key}: ${e?.message || String(e)}`);
              }
            }
          }

          let method: string | undefined;
          let url: string | undefined;
          let status: number | undefined;

          if (checkOk) {
            if (!Array.isArray(check.do) || check.do.length === 0) {
              checkOk = false;
              notes.push("Check has no steps (do[]).");
            } else {
              for (const st of check.do) {
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
            work_item: {
              key: check.work_item,
              says: check.says,
              links: check.links,
            },
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

            if (opts.failFast) break;
          }
        }

        console.log("");
        if (opts.failFast && failed > 0) break;
      }

      if (opts.failFast && failed > 0) break;
    }

    const report = {
      baseUrl: baseUrl || "",
      total,
      failed,
      passed: total - failed,
      ok: failed === 0,
      results,
    };

    const out = path.resolve(process.cwd(), opts.report);
    fs.writeFileSync(out, JSON.stringify(report, null, 2), "utf8");
    console.log(`Report written: ${out}`);

    process.exit(failed === 0 ? 0 : 1);
  });

program.parse(process.argv);