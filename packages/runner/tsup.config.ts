// packages/runner/tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  target: "es2022",
  platform: "node",
  outDir: "dist",
  clean: true,
  splitting: false,
  minify: true,

  // Force bundling ALL deps into dist (no runtime node_modules)
  noExternal: [/.*/],
});
