import "./styles";
import { tinyassert } from "@hiogawa/utils";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { registerServiceWorker } from "./service-worker/window";

function main() {
  if (import.meta.env.PROD) {
    registerServiceWorker(); // hunging promise
  }
  const el = document.querySelector("#root");
  tinyassert(el);
  const root = createRoot(el);
  root.render(React.createElement(App));
}

main();
