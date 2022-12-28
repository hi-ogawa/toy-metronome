import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";
import { mainNoOp } from "./no-op";

//
// NOTE:
// - precache cannot be really "emulated" during `vite dev` so service worker registration is only enabled when `import.meta.env.PROD`.
//   it can be still tested locally via `vite preview`.
//
// - when offline, the page will go blank when only `index.html` is cached but not the main js/css assets,
//   which is extremely worse than browser showing "No internet" page.
//
// - for the initial page (index.html) to be cached, brand new users have to visit a page twice
//   since the first navigation is not handled by service worker and there's no explicit precaching for `index.html`.
//

// https://developer.chrome.com/docs/workbox/modules/workbox-recipes/

// precache all files under "/assets/..."
declare const self: { __PRECACHE_MANIFEST?: any }; // this constant is replaced during vite build (see serviceWorkerPrecachePlugin in vite.config.ts)
function setupAssetsPrecache() {
  precacheAndRoute(self.__PRECACHE_MANIFEST ?? []);
}

// "network first" for nagivation "/index.html"
function setupNavigationCache() {
  registerRoute(
    ({ request }) => {
      return request.mode === "navigate";
    },
    new NetworkFirst({
      cacheName: "navigation",
      plugins: [
        // @ts-expect-error exactOptionalPropertyTypes fails (https://github.com/GoogleChrome/workbox/issues/3141)
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );
}

function main() {
  setupAssetsPrecache();
  setupNavigationCache();
}

const SW_NOOP: boolean = false; // maybe set it `true` for debugging
if (SW_NOOP) {
  mainNoOp();
} else {
  main();
}
