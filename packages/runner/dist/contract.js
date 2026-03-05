// src/contract.ts
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

// src/env.ts
function isObj(x) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}
var ENV_RE = /\$\{([A-Z0-9_]+)\}/g;
function interpolate(input) {
  if (typeof input === "string") {
    return input.replace(ENV_RE, (_, name) => process.env[name] ?? "");
  }
  if (Array.isArray(input)) return input.map(interpolate);
  if (isObj(input)) {
    const out = {};
    for (const [k, v] of Object.entries(input)) out[k] = interpolate(v);
    return out;
  }
  return input;
}

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
   * - body: { json: ... }  (preferred)
   * - body: { jsonFile: ... } (preferred)
   * - body: { text: ... } (preferred)
   * - body: { ... } (legacy direct JSON object allowed)
   * - body: "raw string" (legacy)
   */
  body: z.union([
    HttpBodySchema,
    z.string(),
    // legacy raw string
    z.record(z.string(), z.any()),
    // legacy JSON object
    z.array(z.any()),
    // legacy JSON array
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

// src/contract.ts
function loadSuite(filePath) {
  const abs = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) throw new Error(`Contract file not found: ${abs}`);
  const raw = fs.readFileSync(abs, "utf8");
  const data = filePath.endsWith(".json") ? JSON.parse(raw) : yaml.load(raw);
  const interpolated = interpolate(data);
  const result = SuiteSchema.safeParse(interpolated);
  if (!result.success) {
    const errorMsg = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid contract format:
${errorMsg}`);
  }
  return result.data;
}
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
  loadSuite
};
