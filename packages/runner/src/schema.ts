import { z } from "zod";

// --- Expectations (moved from contract.ts) ---
export const ExpectationSchema = z.object({
  status: z.number().optional(),
  json: z.any().optional(),
  bodyContains: z.string().optional(),
  exit_code: z.number().optional(),
  stdout_contains: z.string().optional(),
  stderr_contains: z.string().optional(),
  stdout_not_contains: z.string().optional(),
  stderr_not_contains: z.string().optional(),
  stdout_regex: z.string().optional(),
  stderr_regex: z.string().optional(),
  stdout_empty: z.boolean().optional(),
  stderr_empty: z.boolean().optional(),
  max_duration_ms: z.number().optional(),
  rows: z.number().optional(),
  equals: z.record(z.string(), z.any()).optional(),
});

// --- Step Definitions ---
export const HttpStepSchema = z.object({
  method: z.string(),
  path: z.string().startsWith("/"),
  headers: z.record(z.string(), z.string()).optional(),
  query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  body: z.any().optional(),
  timeout_ms: z.number().optional(),
  retries: z.number().optional(),
});

export const ExecStepSchema = z.object({
  run: z.string(),
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  timeout_ms: z.number().optional(),
  retries: z.number().optional(),
  max_output_chars: z.number().optional(),
});

export const SqlStepSchema = z.object({
  driver: z.literal("postgres"),
  url_env: z.string(),
  query: z.string(),
  timeout_ms: z.number().optional(),
});

// --- Union of Steps ---
export const StepSchema = z.union([
  z.object({ http: HttpStepSchema, expect: ExpectationSchema.optional() }),
  z.object({ exec: ExecStepSchema, expect: ExpectationSchema.optional() }),
  z.object({ sql: SqlStepSchema, expect: ExpectationSchema.optional() }),
]);

export const CheckSchema = z.object({
  id: z.string(),
  work_item: z.string().optional(),
  says: z.string().optional(),
  links: z.array(z.string()).optional(),
  steps: z.array(StepSchema).min(1),
});

export const ContractSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  checks: z.array(CheckSchema).min(1),
});

export const SuiteSchema = z.object({
  version: z.literal(1),
  feature: z.string(),
  description: z.string().optional(),
  contracts: z.array(ContractSchema).min(1),
});

// --- Inferred Types for your whole app ---
export type SuiteFileV1 = z.infer<typeof SuiteSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Check = z.infer<typeof CheckSchema>;
export type HttpStep = z.infer<typeof HttpStepSchema>;
export type ExecStep = z.infer<typeof ExecStepSchema>;
export type SqlStep = z.infer<typeof SqlStepSchema>;
export type Expectation = z.infer<typeof ExpectationSchema>;