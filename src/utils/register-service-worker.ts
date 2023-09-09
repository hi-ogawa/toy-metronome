const SERVICE_WORKER_URL = "/service-worker.js";

export async function registerServiceWorker() {
  const { serviceWorker } = window.navigator;
  if (serviceWorker) {
    await serviceWorker.register(SERVICE_WORKER_URL);
  }
}
