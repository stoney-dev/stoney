import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  target: "es2022",
  platform: "node",
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: true,

  // ✅ Force tsup to bundle deps so dist does NOT need node_modules at runtime.
  noExternal: ["js-yaml", "fast-glob", "commander"],
});
