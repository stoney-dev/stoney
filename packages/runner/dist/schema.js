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
var HttpBodySchema = z.object({
  json: z.any().optional(),
  jsonFile: z.string().optional(),
  text: z.string().optional()
}).superRefine((v, ctx) => {
  const chosen = [v.json !== void 0, !!v.jsonFile, v.text !== void 0].filter(Boolean).length;
  if (chosen === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "body must include exactly one of: json, jsonFile, text"
    });
  }
  if (chosen > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "body must include only one of: json, jsonFile, text"
    });
  }
});
var HttpStepSchema = z.object({
  method: z.string(),
  path: z.string().startsWith("/"),
  headers: z.record(z.string(), z.string()).optional(),
  query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  /**
   * Back-compat + UX:
   * - body: { json: ... }      (preferred)
   * - body: { jsonFile: ... }  (preferred)
   * - body: { text: ... }      (preferred)
   * - body: { ... }            (legacy direct JSON object allowed)
   * - body: "raw string"       (legacy)
   */
  body: z.union([
    HttpBodySchema,
    z.string(),
    z.record(z.string(), z.any()),
    z.array(z.any()),
    z.number(),
    z.boolean(),
    z.null()
  ]).optional(),
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
var WorkItemObjectSchema = z.object({
  key: z.string(),
  says: z.string().optional(),
  links: z.array(z.string()).optional()
});
var WorkItemSchema = z.union([z.string(), WorkItemObjectSchema]);
var CheckSchema = z.object({
  id: z.string(),
  /**
   * Supported forms:
   *
   * 1) Simple:
   *    work_item: "KAN-123"
   *    says: "..."
   *    links: ["..."]
   *
   * 2) Structured:
   *    work_item:
   *      key: "KAN-123"
   *      says: "..."
   *      links: ["..."]
   *
   * Top-level says/links remain supported for backward compatibility
   * and can be used as fallbacks when work_item is a string.
   */
  work_item: WorkItemSchema.optional(),
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
  HttpBodySchema,
  HttpStepSchema,
  SqlStepSchema,
  StepSchema,
  SuiteSchema,
  WorkItemObjectSchema,
  WorkItemSchema
};
