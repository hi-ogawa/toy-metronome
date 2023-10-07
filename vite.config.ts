import { themeScriptPlugin } from "@hiogawa/theme-script/dist/vite";
import unocss from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      react: "@hiogawa/tiny-react",
    },
  },
  build: {
    sourcemap: true,
  },
  plugins: [
    unocss(),
    themeScriptPlugin({
      storageKey: "toy-metronome:theme",
      defaultTheme: "dark",
    }),
  ],
});
