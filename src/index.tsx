import "virtual:uno.css";
import { tinyassert } from "@hiogawa/utils";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { initAudioContext } from "./utils/audio-context";
import { initQueryClient } from "./utils/query-utils";
import { registerServiceWorker } from "./utils/register-service-worker";

function main() {
  registerServiceWorker(); // hunging promise
  initAudioContext();
  initQueryClient();
  const el = document.querySelector("#root");
  tinyassert(el);
  const root = createRoot(el);
  root.render(React.createElement(App));
}

main();
