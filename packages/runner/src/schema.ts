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

// --- HTTP Body (NEW) ---
// Preferred: body: { json: {...} } OR body: { jsonFile: "..." } OR body: { text: "..." }
export const HttpBodySchema = z
  .object({
    json: z.any().optional(),
    jsonFile: z.string().optional(),
    text: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    const chosen = [v.json !== undefined, !!v.jsonFile, v.text !== undefined].filter(Boolean).length;
    if (chosen === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "body must include exactly one of: json, jsonFile, text",
      });
    }
    if (chosen > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "body must include only one of: json, jsonFile, text",
      });
    }
  });

// --- Step Definitions ---
export const HttpStepSchema = z.object({
  method: z.string(),
  path: z.string().startsWith("/"),
  headers: z.record(z.string(), z.string()).optional(),
  query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),

  /**
   * Back-compat + UX:
   * - body: { json: ... }  (preferred)
   * - body: { jsonFile: ... } (preferred)
   * - body: { text: ... } (preferred)
   * - body: { ... } (legacy direct JSON object allowed)
   * - body: "raw string" (legacy)
   */
   body: z.union([
    HttpBodySchema,
    z.string(), // legacy raw string
    z.record(z.string(), z.any()), // legacy JSON object
    z.array(z.any()), // legacy JSON array
    z.number(),
    z.boolean(),
    z.null(),
  ]).optional(),
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