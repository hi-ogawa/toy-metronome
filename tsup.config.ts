import { defineConfig } from "tsup";

export default [
  defineConfig({
    entry: ["src/audioworklet/index.ts"],
    outDir: "src/audioworklet/build",
    format: ["esm"],
    noExternal: [/.*/],
  }),
  defineConfig({
    entry: ["src/service-worker/index.ts"],
    outDir: "src/service-worker/build",
    format: ["esm"],
    noExternal: [/.*/],
  }),
];
