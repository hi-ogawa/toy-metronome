// no-op service worker to rescue from buggy service worker and start from clean slate
// https://developer.chrome.com/docs/workbox/remove-buggy-service-workers/

// set global for typescript
declare let self: ServiceWorkerGlobalScope;

export function mainNoOp() {
  self.addEventListener("install", () => {
    self.skipWaiting();
  });

  self.addEventListener("activate", async () => {
    const clients = await self.clients.matchAll({
      type: "window",
    });
    for (const client of clients) {
      client.navigate(client.url);
    }
  });
}
