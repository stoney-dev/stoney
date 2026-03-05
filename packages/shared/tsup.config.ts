import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    telemetry: "src/telemetry.ts"
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: false,
  splitting: false,
  target: "node18"
});