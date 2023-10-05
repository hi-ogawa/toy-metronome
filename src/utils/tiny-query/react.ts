import { tinyassert } from "@hiogawa/utils";
import React from "react";
import {
  MueryObserver,
  type MueryObserverOptions,
  QueryClient,
  QueryObserver,
  type QueryObserverOptions,
} from "./core";

export function useQuery<T>(options: QueryObserverOptions<T>) {
  const [observer] = React.useState(() => {
    tinyassert(QueryClient.current);
    return new QueryObserver(QueryClient.current, options);
  });

  React.useEffect(() => {
    observer.setOption(options);
  }, [options]);

  React.useSyncExternalStore(
    React.useCallback(observer.subscribe, [observer.query]),
    observer.getSnapshot,
    observer.getSnapshot
  );

  return observer.getSnapshot();
}

export function useMutation<V, T>(options: MueryObserverOptions<V, T>) {
  const [observer] = React.useState(() => {
    tinyassert(QueryClient.current);
    return new MueryObserver(QueryClient.current, options);
  });

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
