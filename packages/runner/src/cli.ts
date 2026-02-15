import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { Command } from "commander";
import { loadSuite } from "./contract.js";
import { runScenarioHttp } from "./http.js";

function readVersion(): string {
  // Resolve package.json relative to this file (works in bundled output too)
  try {
    // __dirname exists in CJS bundles. In ESM dev (tsx), use import.meta.url fallback.
    // tsup will bundle this nicely either way.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyGlobal = globalThis as any;
    const here =
      typeof __dirname !== "undefined"
        ? __dirname
        : path.dirname(new URL(import.meta.url).pathname);

    const pkgPath = path.resolve(here, "..", "package.json");
    const raw = fs.readFileSync(pkgPath, "utf8");
    const pkg = JSON.parse(raw);
    return typeof pkg.version === "string" ? pkg.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const program = new Command();

program
  .name("stoney")
  .description("Stoney — run HTTP contracts in CI.")
  .version(readVersion());

program.command("hello").action(() => console.log("🪨 Stoney is alive."));

program
  .command("parse")
  .argument("<file>", "Suite file (.yml/.yaml or .json)")
  .option("--pretty", "Pretty-print JSON")
  .action((file: string, opts: { pretty?: boolean }) => {
    const suite = loadSuite(file);
    console.log(opts.pretty ? JSON.stringify(suite, null, 2) : JSON.stringify(suite));
  });

program
  .command("run")
  .requiredOption("--suite <glob>", "Suite file path or glob (e.g. contracts/*.yml)")
  .option("--base-url <url>", "Base URL (defaults to STONEY_BASE_URL env var)")
  .option("--report <path>", "JSON report output path", "stoney-report.json")
  .option("--only-contract <name>", "Run only one contract by name")
  .option("--only-scenario <id>", "Run only one scenario id")
  .option("--fail-fast", "Stop on first failure", false)
  .action(async (opts: any) => {
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
    const results: any[] = [];

    console.log(`\n🪨 Stoney run`);
    console.log(`Base URL: ${baseUrl}`);
    console.log(`Suites: ${suitePaths.join(", ")}\n`);

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
            console.log(`  ✅ ${scenario.id} (${r.status ?? "?"})`);
          } else {
            failed++;
            console.log(`  ❌ ${scenario.id} (${r.status ?? "?"})`);
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
      results,
    };

    const out = path.resolve(process.cwd(), opts.report);
    fs.writeFileSync(out, JSON.stringify(report, null, 2), "utf8");
    console.log(`Report written: ${out}`);

    process.exit(failed === 0 ? 0 : 1);
  });

program.parse(process.argv);
