import fs from "node:fs";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import { Plugin, defineConfig } from "vite";

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [unocss(), react(), serviceWorkerPrecachePlugin()],
});

function serviceWorkerPrecachePlugin(): Plugin {
  const injectionPoint = "self.__PRECACHE_MANIFEST";
  const swSrc = "./src/service-worker/build/index.js";
  const swDst = "./dist/service-worker.js";
  const baseUrl = "/";

  return {
    name: serviceWorkerPrecachePlugin.name,
    generateBundle: async (_options, bundle) => {
      const manifest = Object.keys(bundle).map((url) => baseUrl + url);
      let sw = await fs.promises.readFile(swSrc, "utf-8");
      sw = sw.replace(injectionPoint, JSON.stringify(manifest));
      await fs.promises.writeFile(swDst, sw);
    },
  };
}
