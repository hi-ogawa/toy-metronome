import "virtual:uno.css";
import { tinyassert } from "@hiogawa/utils";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { initAudioContext } from "./utils/audio-context";
import { registerServiceWorker } from "./utils/register-service-worker";

function main() {
  registerServiceWorker(); // hunging promise
  initAudioContext();
  const el = document.querySelector("#root");
  tinyassert(el);
  const root = createRoot(el);
  root.render(<App />);
}

main();
