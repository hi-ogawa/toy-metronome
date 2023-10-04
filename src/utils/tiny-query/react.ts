import React from "react";
import {
  MueryObserver,
  type MueryObserverOptions,
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

export function useMutation<V, T>(options: MueryObserverOptions<V, T>) {
  const [observer] = React.useState(() => new MueryObserver(options));

  // take latest value of mutationFn/onSuccess/onError
  React.useEffect(() => {
    observer.setOption(options);
  }, [observer, options]);

  React.useSyncExternalStore(
    observer.subscribe,
    observer.getSnapshot,
    observer.getSnapshot
  );

  return { ...observer.result, mutate: observer.mutate };
}
