// reset service workers installed in the past
// https://developer.chrome.com/docs/workbox/remove-buggy-service-workers/

function main() {
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

main();
