import { Workbox } from "workbox-window";

const SERVICE_WORKER_URL = "/service-worker.js";

export async function registerServiceWorker() {
  const { serviceWorker } = window.navigator;
  if (serviceWorker) {
    const workbox = new Workbox(SERVICE_WORKER_URL);
    await workbox.register();
  }
}
