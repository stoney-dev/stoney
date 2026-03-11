import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/cli.ts"],
    outDir: "dist",
    format: ["cjs"],
    platform: "node",
    target: "node18",
    bundle: true,
    splitting: false,
    clean: true,
    minify: false,
    sourcemap: true,
    dts: false,
    shims: true, // ← fixes import.meta.url → __dirname in CJS output
    noExternal: [
      "commander",
      "fast-glob",
      "js-yaml",
      "zod",
      "zod-to-json-schema"
    ],
    external: ["pg", "pg-native"],
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
