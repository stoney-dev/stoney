import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/cli.ts"],
    outDir: "dist",
    format: ["cjs"],
    platform: "node",
    target: "node18",
    splitting: false,
    clean: true,
    minify: true,
    sourcemap: false,
    noExternal: [
      "commander",
      "fast-glob",
      "js-yaml",
      "pg",
      "zod",
      "zod-to-json-schema"
    ],
    outExtension() {
      return { js: ".cjs" };
    }
  },
  {
    entry: {
      schema: "src/schema.ts",
      types: "src/types.ts",
      contract: "src/contract.ts",
      telemetry: "src/telemetry.ts"
    },
    outDir: "dist",
    format: ["esm"],
    platform: "node",
    target: "node18",
    dts: true,
    splitting: false,
    clean: false,
    minify: false,
    sourcemap: false
  }
]);