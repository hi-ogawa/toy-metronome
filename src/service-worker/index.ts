import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";

// https://developer.chrome.com/docs/workbox/modules/workbox-recipes/

// network first for nagivation "/index.html"
function pageCache() {
  // TODO
}

// cache first for hashed assets under "/assets"
function assetsCache() {
  registerRoute(
    ({ request }) => {
      request.url.startsWith("/assets");
      return true;
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

// @ts-expect-error
function main() {
  pageCache();
  assetsCache();
}

// main();
