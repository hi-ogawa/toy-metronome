import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { mainNoOp } from "./no-op";

// https://developer.chrome.com/docs/workbox/modules/workbox-recipes/

// "network first" for nagivation "/index.html"
function setupNavigationCache() {
  registerRoute(
    ({ request }) => {
      return request.mode === "navigate";
    },
    new NetworkFirst({
      cacheName: "navigation",
      networkTimeoutSeconds: 3,
      plugins: [
        // @ts-expect-error exactOptionalPropertyTypes fails (https://github.com/GoogleChrome/workbox/issues/3141)
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );
}

// "cache first" for hashed assets under "/assets"
function setupAssetsCache() {
  registerRoute(
    ({ request }) => {
      return request.url.startsWith("/assets");
    },
    new CacheFirst({
      cacheName: "assets",
      plugins: [
        // @ts-expect-error exactOptionalPropertyTypes fails (https://github.com/GoogleChrome/workbox/issues/3141)
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );
}

// @ts-ignore
function main() {
  setupNavigationCache();
  setupAssetsCache();
}

mainNoOp();
// main();
