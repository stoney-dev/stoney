#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { Command } from "commander";
import { loadSuite, type SuiteFileV1, type Step, hasReqMapping } from "./contract.js";
import { runHttpStep } from "./http.js";
import { runExecStep } from "./exec.js";
import { runSqlStep } from "./sql.js";
import { loadSuiteFromJiraIssue } from "./jira.js";
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
  const v = String(process.env[name] || "")
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function printReqLine(req: any) {
  if (!req || typeof req !== "object") return;
  const issue = typeof req.issue === "string" ? req.issue : "";
  const ac = Array.isArray(req.ac) ? req.ac.join(", ") : "";
  const text = typeof req.text === "string" ? req.text : "";
  const tag = [issue, ac].filter(Boolean).join(" ");
  const line = [tag, text].filter(Boolean).join(" — ");
  if (line) console.log(`     req: ${line}`);
}

/**
 * If the user provided an explicit boolean flag, it should win over env.
 * Commander sets flags to true/false. But we need to know if it was explicitly provided.
 */
function didUserPassFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag);
}

program
  .command("run")
  .requiredOption("--suite <glob>", "Suite file path or glob (e.g. contracts/*.yml)")
  .option(
    "--jira-issue <key>",
    "Jira issue key containing a stoney/yaml code block (repeatable)",
    (v, p: string[]) => (p ? [...p, v] : [v]),
    []
  )
  .option("--base-url <url>", "Base URL (defaults to STONEY_BASE_URL env var)")
  .option("--report <path>", "JSON report output path", "stoney-report.json")
  .option("--only-contract <name>", "Run only one contract by name")
  .option("--only-scenario <id>", "Run only one scenario id")
  .option("--fail-fast", "Stop on first failure", false)
  .option("--require-req", "Fail scenarios missing req mapping", false)
  .action(async (opts: any) => {
    const baseUrl = opts.baseUrl || process.env.STONEY_BASE_URL;

    // ✅ Make requireReq deterministic:
    // - if flag was explicitly passed, use it
    // - else fall back to env
    const argv = process.argv.slice(2);
    const requireReq = didUserPassFlag(argv, "--require-req") ? Boolean(opts.requireReq) : envFlag("STONEY_REQUIRE_REQ");

    // Load local suite files
    const suitePaths = await fg(opts.suite, { onlyFiles: true, unique: true });
    const suites: SuiteFileV1[] = [];
    for (const p of suitePaths) suites.push(loadSuite(p));

    // Load suites from Jira issues (optional)
    const jiraKeys: string[] = Array.isArray(opts.jiraIssue) ? opts.jiraIssue : [];
    for (const key of jiraKeys) {
      console.log(`🔎 Jira: fetching suite from issue ${key} ...`);
      const parsed = await loadSuiteFromJiraIssue(key);
      if (!parsed || typeof parsed !== "object") throw new Error(`Jira suite ${key} did not parse to an object.`);
      console.log(`✅ Jira: loaded suite from issue ${key}`);
      suites.push(parsed as any);
    }

    if (!suites.length) {
      console.error(`No suite files matched: ${opts.suite} and no Jira issues provided.`);
      process.exit(2);
    }

    let failed = 0;
    let total = 0;
    const results: Array<{ suite: string; contract: string } & ScenarioResult> = [];

    console.log(`\n🪨 Stoney run`);
    if (baseUrl) console.log(`Base URL: ${baseUrl}`);
    console.log(`Suites loaded: ${suites.length}`);
    if (requireReq) console.log(`Req enforcement: ON`);
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

          // Scenario-level notes ONLY (no step notes here)
          const scenarioNotes: string[] = [];

          // Collect step results (including failures)
          const stepResults: StepResult[] = [];

          // Optional: enforce req mapping (fast fail)
          if (requireReq && !hasReqMapping((scenario as any).req)) {
            scenarioOk = false;
            scenarioNotes.push("Missing req mapping (required). Add req.text and/or req.ac.");
          }

          let method: string | undefined;
          let url: string | undefined;
          let status: number | undefined;

          // Run steps only if req enforcement didn't already fail
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
            req: (scenario as any).req,
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
            printReqLine((scenario as any).req);

            // Print failing steps
            const badSteps = stepResults.filter((x) => !x.ok);
            for (const sr of badSteps) {
              console.log(`     ${sr.title}`);
              for (const n of sr.notes) console.log(`     - ${n}`);
            }

            // Print scenario-level notes (req enforcement, no steps, etc.)
            for (const n of scenarioNotes) console.log(`     - ${n}`);

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
