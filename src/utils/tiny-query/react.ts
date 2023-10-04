import React from "react";
import {
  MueryObserver,
  type MueryObserverOptions,
  QueryClient,
  QueryObserver,
  type QueryObserverOptions,
  serializeQueryKey,
} from "./core";

export function useQuery<T>(options: QueryObserverOptions<T>) {
  const observer = React.useMemo(
    () => new QueryObserver(QueryClient.current, options),
    [serializeQueryKey(options.queryKey)]
  );

  React.useSyncExternalStore(
    observer.subscribe,
    observer.getSnapshot,
    observer.getSnapshot
  );

  return observer.getSnapshot();
}

export function useMutation<V, T>(options: MueryObserverOptions<V, T>) {
  const [observer] = React.useState(
    () => new MueryObserver(QueryClient.current, options)
  );

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
