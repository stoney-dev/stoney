import { defineConfig } from "tsup";

export default defineConfig([
  // 1) CLI bundle for GitHub Action runtime
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

    // Bundle all runtime dependencies the CLI needs,
    // because the GitHub Action does not run pnpm install.
    noExternal: [
      "commander",
      "fast-glob",
      "js-yaml",
      "pg",
      "zod"
    ],

    outExtension() {
      return { js: ".cjs" };
    },
  },

  // 2) Library outputs for external consumers like stoney-web
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
  },
]);