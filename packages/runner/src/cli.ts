#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { Command } from "commander";
import { loadSuite, type SuiteFileV1, type Step } from "./contract.js";
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

program
  .command("run")
  .requiredOption("--suite <glob>", "Suite file path or glob (e.g. contracts/*.yml)")
  .option("--jira-issue <key>", "Jira issue key containing a ```stoney or ```yaml fenced suite (repeatable)", (v, p: string[]) => (p ? [...p, v] : [v]), [])
  .option("--base-url <url>", "Base URL (defaults to STONEY_BASE_URL env var)")
  .option("--report <path>", "JSON report output path", "stoney-report.json")
  .option("--only-contract <name>", "Run only one contract by name")
  .option("--only-scenario <id>", "Run only one scenario id")
  .option("--fail-fast", "Stop on first failure", false)
  .action(async (opts: any) => {
    const baseUrl = opts.baseUrl || process.env.STONEY_BASE_URL;

    // 1) Load suites from files
    const suitePaths = await fg(opts.suite);
    const suites: SuiteFileV1[] = [];

    for (const p of suitePaths) {
      suites.push(loadSuite(p));
    }

    // 2) Load suites from Jira issues
    const jiraKeys: string[] = Array.isArray(opts.jiraIssue) ? opts.jiraIssue : [];
    for (const key of jiraKeys) {
      const parsed = await loadSuiteFromJiraIssue(key);
      // Minimal validation: must look like SuiteFileV1
      if (!parsed || typeof parsed !== "object") throw new Error(`Jira suite ${key} did not parse to an object.`);
      suites.push(parsed as any);
    }

    if (!suites.length) {
      console.error(`No suite files matched: ${opts.suite} and no Jira issues provided.`);
      process.exit(2);
    }

    let failed = 0;
    let total = 0;
    const results: any[] = [];

    console.log(`\n🪨 Stoney run`);
    if (baseUrl) console.log(`Base URL: ${baseUrl}`);
    console.log(`Suites loaded: ${suites.length}\n`);

    for (const suite of suites) {
      for (const contract of suite.contracts) {
        if (opts.onlyContract && contract.name !== opts.onlyContract) continue;

        console.log(`Suite: ${suite.suite}  Contract: ${contract.name}`);

        for (const scenario of contract.scenarios) {
          if (opts.onlyScenario && scenario.id !== opts.onlyScenario) continue;

          total++;

          const steps = normalizeSteps(scenario);
          let scenarioOk = true;
          const stepResults: StepResult[] = [];
          const notes: string[] = [];

          // back-compat: keep method/url/status populated from the last HTTP step (if any)
          let method: string | undefined;
          let url: string | undefined;
          let status: number | undefined;

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
              notes.push(`${r.title}`);
              for (const n of r.notes) notes.push(`- ${n}`);
              if (opts.failFast) break;
            }
          }

          const row: ScenarioResult = {
            id: scenario.id,
            ok: scenarioOk,
            method,
            url,
            status,
            notes,
            steps: stepResults,
          };

          results.push({ suite: suite.suite, contract: contract.name, ...row });

          if (scenarioOk) {
            console.log(`  ✅ ${scenario.id}`);
          } else {
            failed++;
            console.log(`  ❌ ${scenario.id}`);
            for (const sr of stepResults.filter((x) => !x.ok)) {
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
