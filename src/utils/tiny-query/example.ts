import { QueryClient } from "./core";

QueryClient.init({
  defaultOptions: {
    queries: {
      onError: (e) => {
        console.error("query error", e);
        window.alert("Something went wrong...");
      },
    },
    mutations: {
      onError: (e) => {
        console.error("mutation error", e);
        window.alert("Something went wrong...");
      },
    },
  },
});
