import { defineConfig } from "tsup";

export default [
  defineConfig({
    entry: ["src/audioworklet/index.ts"],
    outDir: "src/audioworklet/build",
    format: ["esm"],
    noExternal: [/.*/],
  }),
];
