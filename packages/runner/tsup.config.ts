import { defineConfig } from "tsup";

export default defineConfig([
  // 1) CLI bundle (keeps your current behavior)
  {
    entry: ["src/cli.ts"],
    outDir: "dist",

    format: ["cjs"],
    platform: "node",
    target: "node18",

    splitting: false,
    clean: true, // clean ONCE here
    minify: true,
    sourcemap: false,

    noExternal: ["commander", "fast-glob", "js-yaml", "pg"],

    outExtension() {
      return { js: ".cjs" };
    },
  },

  // 2) Library outputs for stoney-web imports
  {
    entry: {
      schema: "src/schema.ts",
      types: "src/types.ts",      // remove if you don't have src/types.ts
      contract: "src/contract.ts" // optional but useful
    },
    outDir: "dist",

    format: ["esm"],
    platform: "node",
    target: "node18",

    dts: true,        // <-- this is what creates schema.d.ts
    splitting: false,
    clean: false,     // <-- IMPORTANT: don't wipe dist after cli build
    minify: false,    // keep readable
    sourcemap: false,

    // leave deps external for a library (zod stays a dependency)
    // noExternal: []  (default)
  },
]);