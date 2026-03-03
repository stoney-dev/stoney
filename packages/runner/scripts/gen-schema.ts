import { zodToJsonSchema } from "zod-to-json-schema";
import { SuiteSchema } from "../src/schema.js";
import type { ZodTypeAny } from "zod";
import * as fs from "node:fs";

// IMPORTANT: cast before calling to stop TS from instantiating SuiteSchema's full generic type
const schema: ZodTypeAny = SuiteSchema;

const jsonSchema = zodToJsonSchema(schema, "StoneyContractSchema");

fs.writeFileSync("../../schema.json", JSON.stringify(jsonSchema, null, 2), "utf8");
console.log("✅ Generated schema.json for IDE support.");