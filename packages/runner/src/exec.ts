// packages/runner/src/exec.ts
import { spawn } from "node:child_process";
import path from "node:path";
import type { ExecStep, Expectation } from "./contract.js";
import type { StepResult } from "./types.js";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function trunc(s: string, max = 8192) {
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max) + `\n…(truncated, ${s.length - max} more chars)`;
}

function safeRegex(pat: string): RegExp | null {
  try {
    return new RegExp(pat);
  } catch {
    return null;
  }
}

type ExecRunResult = {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
};

export async function runExecStep(step: ExecStep, expect?: Expectation): Promise<StepResult> {
  const notes: string[] = [];
  const title = `exec ${step.run}`;

  const timeoutMs =
    typeof step.timeout_ms === "number" ? step.timeout_ms : Number(process.env.STONEY_TIMEOUT_MS || 15000);
  const retries = typeof step.retries === "number" ? step.retries : 0;
  const cwd = step.cwd ? path.resolve(process.cwd(), step.cwd) : process.cwd();
  const maxOut = typeof step.max_output_chars === "number" ? step.max_output_chars : 8192;

  let lastErr: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await new Promise<ExecRunResult>((resolve, reject) => {
        const started = Date.now();

        const child = spawn(step.run, {
          cwd,
          shell: true,
          env: { ...process.env, ...(step.env || {}) },
          stdio: ["ignore", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";
        let timedOut = false;

        child.stdout?.on("data", (d) => (stdout += d.toString()));
        child.stderr?.on("data", (d) => (stderr += d.toString()));

        const t = setTimeout(() => {
          timedOut = true;
          try {
            child.kill("SIGTERM");
          } catch {}
          setTimeout(() => {
            try {
              child.kill("SIGKILL");
            } catch {}
          }, 500);
        }, timeoutMs);

        child.on("error", (e) => {
          clearTimeout(t);
          reject(e);
        });

        child.on("close", (code, signal) => {
          clearTimeout(t);
          const durationMs = Date.now() - started;
          resolve({ code, signal, stdout, stderr, durationMs, timedOut });
        });
      });

      const stdout = trunc(res.stdout, maxOut);
      const stderr = trunc(res.stderr, maxOut);

      let ok = true;

      const expectedCode = typeof expect?.exit_code === "number" ? expect.exit_code : 0;

      if (res.timedOut) {
        ok = false;
        notes.push(`Exec timeout after ${timeoutMs}ms.`);
      } else if (res.code !== expectedCode) {
        ok = false;
        notes.push(`Expected exit_code ${expectedCode} but got ${res.code}.`);
      }

      const maxDuration = (expect as any)?.max_duration_ms;
      if (typeof maxDuration === "number" && res.durationMs > maxDuration) {
        ok = false;
        notes.push(`Expected max_duration_ms ${maxDuration} but took ${res.durationMs}ms.`);
      }

      if (typeof expect?.stdout_contains === "string" && !res.stdout.includes(expect.stdout_contains)) {
        ok = false;
        notes.push(`Expected stdout to contain: "${expect.stdout_contains}"`);
      }
      if (typeof expect?.stderr_contains === "string" && !res.stderr.includes(expect.stderr_contains)) {
        ok = false;
        notes.push(`Expected stderr to contain: "${expect.stderr_contains}"`);
      }

      const stdoutNot = (expect as any)?.stdout_not_contains;
      if (typeof stdoutNot === "string" && res.stdout.includes(stdoutNot)) {
        ok = false;
        notes.push(`Expected stdout to NOT contain: "${stdoutNot}"`);
      }

      const stderrNot = (expect as any)?.stderr_not_contains;
      if (typeof stderrNot === "string" && res.stderr.includes(stderrNot)) {
        ok = false;
        notes.push(`Expected stderr to NOT contain: "${stderrNot}"`);
      }

      const stdoutRegex = (expect as any)?.stdout_regex;
      if (typeof stdoutRegex === "string") {
        const re = safeRegex(stdoutRegex);
        if (!re) {
          ok = false;
          notes.push(`Invalid stdout_regex: "${stdoutRegex}"`);
        } else if (!re.test(res.stdout)) {
          ok = false;
          notes.push(`Expected stdout to match regex: /${stdoutRegex}/`);
        }
      }

      const stderrRegex = (expect as any)?.stderr_regex;
      if (typeof stderrRegex === "string") {
        const re = safeRegex(stderrRegex);
        if (!re) {
          ok = false;
          notes.push(`Invalid stderr_regex: "${stderrRegex}"`);
        } else if (!re.test(res.stderr)) {
          ok = false;
          notes.push(`Expected stderr to match regex: /${stderrRegex}/`);
        }
      }

      const stderrEmpty = (expect as any)?.stderr_empty;
      if (stderrEmpty === true && res.stderr.trim().length > 0) {
        ok = false;
        notes.push(`Expected stderr to be empty.`);
      }

      const stdoutEmpty = (expect as any)?.stdout_empty;
      if (stdoutEmpty === true && res.stdout.trim().length > 0) {
        ok = false;
        notes.push(`Expected stdout to be empty.`);
      }

      return {
        ok,
        kind: "exec",
        title,
        notes,
        exit_code: res.code,
        signal: res.signal || undefined,
        duration_ms: res.durationMs,
        stdout: stdout || undefined,
        stderr: stderr || undefined,
      };
    } catch (e: any) {
      lastErr = e;
      if (attempt < retries) {
        await sleep(500 * (attempt + 1));
        continue;
      }
    }
  }

  return {
    ok: false,
    kind: "exec",
    title,
    notes: [`Exec error: ${lastErr?.message || String(lastErr)}`],
  };
}