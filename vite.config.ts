import { themeScriptPlugin } from "@hiogawa/theme-script/dist/vite";
import react from "@preact/preset-vite";
import unocss from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    unocss(),
    react({
      include: /\.tsx$/,
    }),
    themeScriptPlugin({
      storageKey: "toy-metronome:theme",
      defaultTheme: "dark",
    }),
  ],
});
