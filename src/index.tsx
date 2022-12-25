import "./styles/index.ts";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { registerServiceWorker } from "./service-worker/window";
import { tinyassert } from "./utils/tinyassert";

function main() {
  registerServiceWorker(); // hunging promise
  const el = document.querySelector("#root");
  tinyassert(el);
  const root = createRoot(el);
  root.render(React.createElement(App));
}

main();
