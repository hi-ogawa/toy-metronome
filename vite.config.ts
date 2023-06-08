import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import { Plugin, defineConfig } from "vite";
import type { PrecacheEntry } from "workbox-precaching";

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    unocss(),
    react(),
    serviceWorkerPrecachePlugin(),
    injectThemeScriptPlugin(),
  ],
});

function serviceWorkerPrecachePlugin(): Plugin {
  const injectionPoint = "self.__PRECACHE_MANIFEST";
  const swSrc = "./src/service-worker/build/index.js";
  const swDst = "./dist/service-worker.js";
  const baseUrl = "/";

  return {
    name: serviceWorkerPrecachePlugin.name,
    generateBundle: async (_options, bundle) => {
      const manifest: PrecacheEntry[] = Object.keys(bundle).map((url) => ({
        url: baseUrl + url,
        revision: null,
      }));
      let sw = await fs.promises.readFile(swSrc, "utf-8");
      sw = sw.replace(injectionPoint, JSON.stringify(manifest));
      await fs.promises.mkdir(path.dirname(swDst), { recursive: true });
      await fs.promises.writeFile(swDst, sw);
    },
  };
}

// inject theme initialization script
function injectThemeScriptPlugin() {
  const script = fs.readFileSync(
    require.resolve("@hiogawa/utils-experimental/dist/theme-script.global.js"),
    "utf-8"
  );
  return {
    name: "local:" + injectThemeScriptPlugin.name,
    transformIndexHtml(html: string) {
      return html.replace(
        /<!--@@INJECT_THEME_SCRIPT@@-->/,
        `\
<script>
  globalThis.__themeStorageKey = "toy-metronome:theme";
  globalThis.__themeDefault = "dark";
  ${script}
</script>`
      );
    },
  };
}
