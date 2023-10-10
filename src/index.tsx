import "virtual:uno.css";
import { createRoot } from "@hiogawa/tiny-react";
import { tinyassert } from "@hiogawa/utils";
import { App } from "./app";
import { initAudioContext } from "./utils/audio-context";
import { registerServiceWorker } from "./utils/register-service-worker";

function main() {
  registerServiceWorker(); // hanging promise
  initAudioContext();
  const el = document.querySelector("#root");
  tinyassert(el);
  const root = createRoot(el);
  root.render(<App />);
}

main();
