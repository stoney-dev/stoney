import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  outDir: "dist",

  format: ["cjs"],
  platform: "node",
  target: "node18",

  splitting: false,
  clean: true,
  minify: true,
  sourcemap: false,

  noExternal: ["commander", "fast-glob", "js-yaml", "pg"],

  outExtension() {
    return { js: ".cjs" };
  },
});
