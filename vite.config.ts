import { themeScriptPlugin } from "@hiogawa/theme-script/dist/vite";
import { tinyReactVitePlugin } from "@hiogawa/tiny-react/dist/plugins/vite";
import unocss from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    unocss(),
    tinyReactVitePlugin(),
    themeScriptPlugin({
      storageKey: "toy-metronome:theme",
      defaultTheme: "dark",
    }),
  ],
});
