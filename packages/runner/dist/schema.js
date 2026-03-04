// src/schema.ts
import { z } from "zod";
var ExpectationSchema = z.object({
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
  equals: z.record(z.string(), z.any()).optional()
});
var HttpStepSchema = z.object({
  method: z.string(),
  path: z.string().startsWith("/"),
  headers: z.record(z.string(), z.string()).optional(),
  query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  body: z.any().optional(),
  timeout_ms: z.number().optional(),
  retries: z.number().optional()
});
var ExecStepSchema = z.object({
  run: z.string(),
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  timeout_ms: z.number().optional(),
  retries: z.number().optional(),
  max_output_chars: z.number().optional()
});
var SqlStepSchema = z.object({
  driver: z.literal("postgres"),
  url_env: z.string(),
  query: z.string(),
  timeout_ms: z.number().optional()
});
var StepSchema = z.union([
  z.object({ http: HttpStepSchema, expect: ExpectationSchema.optional() }),
  z.object({ exec: ExecStepSchema, expect: ExpectationSchema.optional() }),
  z.object({ sql: SqlStepSchema, expect: ExpectationSchema.optional() })
]);
var CheckSchema = z.object({
  id: z.string(),
  work_item: z.string().optional(),
  says: z.string().optional(),
  links: z.array(z.string()).optional(),
  steps: z.array(StepSchema).min(1)
});
var ContractSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  checks: z.array(CheckSchema).min(1)
});
var SuiteSchema = z.object({
  version: z.literal(1),
  feature: z.string(),
  description: z.string().optional(),
  contracts: z.array(ContractSchema).min(1)
});
export {
  CheckSchema,
  ContractSchema,
  ExecStepSchema,
  ExpectationSchema,
  HttpStepSchema,
  SqlStepSchema,
  StepSchema,
  SuiteSchema
};
