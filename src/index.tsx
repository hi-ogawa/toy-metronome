import "virtual:uno.css";
import { tinyassert } from "@hiogawa/utils";
import { render } from "react-dom";
import { App } from "./app";
import { initAudioContext } from "./utils/audio-context";
import { registerServiceWorker } from "./utils/register-service-worker";

function main() {
  registerServiceWorker(); // hunging promise
  initAudioContext();
  const el = document.querySelector("#root");
  tinyassert(el);
  render(<App />, el);
}

main();
