import React from "react";
import {
  QueryClient,
  QueryObserver,
  type QueryObserverOptions,
  serializeQueryKey,
} from "./core";

// still an ugly way to get away from react context...
export function createQueryClientHooks(queryClient: QueryClient) {

  function useQuery<T>(options: QueryObserverOptions<T>) {
    const observer = React.useMemo(
      () => new QueryObserver(queryClient, options),
      [serializeQueryKey(options.queryKey)]
    );

    React.useSyncExternalStore(
      observer.subscribe,
      observer.getSnapshot,
      observer.getSnapshot
    );

    return observer.getSnapshot();
  }

  return { useQuery };
}
