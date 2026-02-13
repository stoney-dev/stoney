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

  // IMPORTANT: bundle all deps into the dist output
  // so the GitHub Action does not need node_modules.
  external: [],
  noExternal: [/.*/],
});
