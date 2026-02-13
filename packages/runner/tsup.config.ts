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

  // Critical: do NOT externalize runtime deps like js-yaml.
  // This forces all deps to be bundled into dist/cli.js.
  noExternal: [/.*/],
});
