import { QueryClient } from "./core";
import { createQueryClientHooks } from "./react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (e) => {
        console.error(e);
        window.alert("Something went wrong...");
      },
    },
  },
});

const { useQuery } = createQueryClientHooks(queryClient);

export { useQuery };
