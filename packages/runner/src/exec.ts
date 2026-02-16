import { spawn } from "node:child_process";
import path from "node:path";
import type { ExecStep, Expectation } from "./contract.js";
import type { StepResult } from "./types.js";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runExecStep(step: ExecStep, expect?: Expectation): Promise<StepResult> {
  const notes: string[] = [];
  const title = `exec ${step.run}`;

  const timeoutMs =
    typeof step.timeout_ms === "number" ? step.timeout_ms : Number(process.env.STONEY_TIMEOUT_MS || 15000);
  const retries = typeof step.retries === "number" ? step.retries : 0;
  const cwd = step.cwd ? path.resolve(process.cwd(), step.cwd) : process.cwd();

  let lastErr: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
        const child = spawn(step.run, {
          cwd,
          shell: true,
          env: { ...process.env, ...(step.env || {}) },
          stdio: ["ignore", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";

        child.stdout?.on("data", (d) => (stdout += d.toString()));
        child.stderr?.on("data", (d) => (stderr += d.toString()));

        const t = setTimeout(() => {
          child.kill("SIGKILL");
          reject(new Error(`exec timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        child.on("error", (e) => {
          clearTimeout(t);
          reject(e);
        });

        child.on("close", (code) => {
          clearTimeout(t);
          resolve({ code, stdout, stderr });
        });
      });

      let ok = true;

      const expectedCode = typeof expect?.exit_code === "number" ? expect.exit_code : 0;
      if (res.code !== expectedCode) {
        ok = false;
        notes.push(`Expected exit_code ${expectedCode} but got ${res.code}.`);
      }

      if (typeof expect?.stdout_contains === "string" && !res.stdout.includes(expect.stdout_contains)) {
        ok = false;
        notes.push(`Expected stdout to contain: "${expect.stdout_contains}"`);
      }

      if (typeof expect?.stderr_contains === "string" && !res.stderr.includes(expect.stderr_contains)) {
        ok = false;
        notes.push(`Expected stderr to contain: "${expect.stderr_contains}"`);
      }

      return { ok, kind: "exec", title, notes };
    } catch (e: any) {
      lastErr = e;
      if (attempt < retries) {
        await sleep(500 * (attempt + 1));
        continue;
      }
    }
  }

  return { ok: false, kind: "exec", title, notes: [`Exec error: ${lastErr?.message || String(lastErr)}`] };
}
