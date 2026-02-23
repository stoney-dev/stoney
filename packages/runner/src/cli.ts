#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { Command } from "commander";
import { loadSuite, type SuiteFileV1, type Step } from "./contract.js";
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
  .argument("<file>", "Suite file (.yml/.yaml or .json)")
  .option("--pretty", "Pretty-print JSON")
  .action((file: string, opts: any) => {
    const suite = loadSuite(file);
    console.log(opts.pretty ? JSON.stringify(suite, null, 2) : JSON.stringify(suite));
  });

function normalizeSteps(s: any): Step[] {
  if (Array.isArray(s.steps) && s.steps.length) return s.steps;
  return [];
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
    return runHttpStep(baseUrl, st.http, st.expect);
  }
  if ("exec" in st) return runExecStep(st.exec, st.expect);
  if ("sql" in st) return runSqlStep(st.sql, st.expect);
  return { ok: false, kind: "exec", title: "unknown", notes: ["Unknown step type."] };
}

function envFlag(name: string): boolean {
  const v = String(process.env[name] || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function didUserPassFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag);
}

function getReqIssue(req: any): string {
  const v = req?.issue;
  return typeof v === "string" ? v.trim() : "";
}

program
  .command("run")
  .requiredOption("--suite <glob>", "Suite file path or glob (e.g. contracts/*.yml)")
  .option("--base-url <url>", "Base URL (defaults to STONEY_BASE_URL env var)")
  .option("--report <path>", "JSON report output path", "stoney-report.json")
  .option("--only-contract <name>", "Run only one contract by name")
  .option("--only-scenario <id>", "Run only one scenario id")
  .option("--fail-fast", "Stop on first failure", false)
  .option("--require-jira", "Require req.issue and validate it exists in Jira (read-only)", false)
  .action(async (opts: any) => {
    const baseUrl = opts.baseUrl || process.env.STONEY_BASE_URL;
    const argv = process.argv.slice(2);

    // deterministic: CLI flag wins, else env
    const requireJira = didUserPassFlag(argv, "--require-jira") ? Boolean(opts.requireJira) : envFlag("STONEY_REQUIRE_JIRA");

    const suitePaths = await fg(opts.suite, { onlyFiles: true, unique: true });
    const suites: SuiteFileV1[] = [];
    for (const p of suitePaths) suites.push(loadSuite(p));

    if (!suites.length) {
      console.error(`No suite files matched: ${opts.suite}`);
      process.exit(2);
    }

    let failed = 0;
    let total = 0;
    const results: Array<{ suite: string; contract: string } & ScenarioResult> = [];

    console.log(`\n🪨 Stoney run`);
    if (baseUrl) console.log(`Base URL: ${baseUrl}`);
    console.log(`Suites loaded: ${suites.length}`);
    if (requireJira) console.log(`Jira work items required: ON (exists check)`);
    console.log("");

    for (const suite of suites) {
      for (const contract of suite.contracts) {
        if (opts.onlyContract && contract.name !== opts.onlyContract) continue;

        console.log(`Suite: ${suite.suite}  Contract: ${contract.name}`);

        for (const scenario of contract.scenarios) {
          if (opts.onlyScenario && scenario.id !== opts.onlyScenario) continue;

          total++;

          const steps = normalizeSteps(scenario);
          let scenarioOk = true;

          const scenarioNotes: string[] = [];
          const stepResults: StepResult[] = [];

          const reqObj = (scenario as any).req;

          // ✅ only enforcement: Jira issue must exist
          if (requireJira) {
            const issue = getReqIssue(reqObj);
            if (!issue) {
              scenarioOk = false;
              scenarioNotes.push(`Missing req.issue (required). Add req.issue: "KAN-123".`);
            } else {
              try {
                const chk = await jiraIssueExists(issue);
                if (!chk.ok) {
                  scenarioOk = false;
                  scenarioNotes.push(`Jira issue does not exist / not accessible: ${issue} — ${chk.message || `status=${chk.status}`}`);
                }
              } catch (e: any) {
                scenarioOk = false;
                scenarioNotes.push(`Jira validation error for ${issue}: ${e?.message || String(e)}`);
              }
            }
          }

          let method: string | undefined;
          let url: string | undefined;
          let status: number | undefined;

          if (scenarioOk) {
            if (!steps.length) {
              scenarioOk = false;
              scenarioNotes.push("Scenario has no steps.");
            } else {
              for (const st of steps) {
                const r = await runOneStep(baseUrl, st);
                stepResults.push(r);

                if (r.kind === "http" && r.method && r.url) {
                  method = r.method;
                  url = r.url;
                  status = r.status;
                }

                if (!r.ok) {
                  scenarioOk = false;
                  if (opts.failFast) break;
                }
              }
            }
          }

          const row: ScenarioResult = {
            id: scenario.id,
            ok: scenarioOk,
            req: reqObj,
            method,
            url,
            status,
            notes: scenarioNotes,
            steps: stepResults,
          };

          results.push({ suite: suite.suite, contract: contract.name, ...row });

          if (scenarioOk) {
            console.log(`  ✅ ${scenario.id}`);
          } else {
            failed++;
            console.log(`  ❌ ${scenario.id}`);
            for (const n of scenarioNotes) console.log(`     - ${n}`);

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