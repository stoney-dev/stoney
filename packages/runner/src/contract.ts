import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { interpolate } from "./env.js";
import { SuiteSchema, type SuiteFileV1 } from "./schema.js";

export * from "./schema.js";

export function loadSuite(filePath: string): SuiteFileV1 {
  const abs = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) throw new Error(`Contract file not found: ${abs}`);

  const raw = fs.readFileSync(abs, "utf8");
  const data = filePath.endsWith(".json") ? JSON.parse(raw) : yaml.load(raw);

  // 1. Interpolate variables (your existing runtime logic)
  const interpolated = interpolate(data);

  // 2. Validate against Zod schema (The "Pro" validation layer)
  const result = SuiteSchema.safeParse(interpolated);

  if (!result.success) {
    const errorMsg = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid contract format:\n${errorMsg}`);
  }

  return result.data;
}