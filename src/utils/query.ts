import React from "react";

//
// tiny-query
//

// current features/limitation
// - shared query
// - fetch on mount
// - only staleTime/gcTime = Infinity
// - refetch/invalidate

// todo (core)
// - global query onError
// - mutation
// - stale data

// todo (react)
// - reactive queryKey

// cf.
// https://tanstack.com/query/v5/docs/react/reference/QueryClient
// https://tanstack.com/query/v5/docs/react/reference/QueryCache

//
// react adapter
//

export function useQuery<T>(options: QueryObserverOptions<T>) {
  const observer = React.useMemo(
    () => new QueryObserver(options),
    [serializeQueryKey(options.queryKey)]
  );

  React.useSyncExternalStore(
    observer.subscribe,
    observer.getSnapshot,
    observer.getSnapshot
  );

  return observer.getSnapshot();
}

//
// framework-agnostic core
//

type QueryKey = unknown[];

function serializeQueryKey(queryKey: QueryKey): string {
  return JSON.stringify(queryKey);
}

interface QueryOptions<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
}

interface QueryObserverOptions<T> extends QueryOptions<T> {
  onSuccess?: (v: T) => void;
  onError?: (e: unknown) => void;
}

export class QueryClient {
  private cache = new Map<string, Query<unknown>>();

  getQuery<T>(options: QueryOptions<T>): Query<T> {
    const key = serializeQueryKey(options.queryKey);
    const query = this.cache.get(key) ?? new Query(options.queryFn);
    return query as Query<T>;
  }

  // TODO: no need these api? (QueryObserver can access Query.fetch directly)

  // fetch<T>(options: QueryOptions<T>): Query<T> {
  //   const key = serializeQueryKey(options.queryKey);
  //   const query = this.cache.get(key) ?? new Query(options.queryFn);
  //   return query as Query<T>;
  // }

  // invalidate(options: { queryKey: QueryKey }) {
  //   const key = serializeQueryKey(options.queryKey);
  //   const query = this.cache.get(key);
  //   if (query) {
  //     query.invalidate();
  //   }
  // }
}

// TODO: include in QueryObserverOptions?
const defaultQueryClient = new QueryClient();

class Query<T> {
  private listeners = new Set<() => void>();
  promise: Promise<void> | undefined;
  result:
    | {
        status: "pending";
        data?: undefined;
        error?: undefined;
      }
    | {
        status: "success";
        data: T;
        error?: undefined;
      }
    | {
        status: "error";
        data?: undefined;
        error: unknown;
      } = { status: "pending" };

  constructor(private queryFn: QueryOptions<T>["queryFn"]) {}

  fetch() {
    this.promise ??= (async () => {
      try {
        const data = await this.queryFn();
        this.result = { status: "success", data };
      } catch (error) {
        this.result = { status: "error", error };
      } finally {
        this.notify();
      }
    })();
  }

  // invalidate() {
  //   this.promise = undefined;
  //   this.result = { status: "pending" };
  //   this.notify();
  //   this.fetch();
  // }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.result;

  private notify() {
    this.listeners.forEach((f) => f());
  }
}

class QueryObserver<T> {
  query: Query<T>;
  // private queryUnsubscribe?: () => void;

  constructor(private options: QueryObserverOptions<T>) {
    this.query = defaultQueryClient.getQuery(this.options);
  }

  // update(newOptions: QueryObserverOptions<T>) {
  //   this.options = newOptions;
  //   const newQuery = defaultQueryClient.getQuery(this.options);
  //   if (this.query !== newQuery) {
  //     // tinyassert(this.queryUnsubscribe);
  //     // this.queryUnsubscribe();
  //     // this.query = newQuery;
  //     // this.queryUnsubscribe = this.query.subscribe(this.notify);
  //   }
  //   this.query.fetch();
  // }

  subscribe = (listener: () => void) => {
    this.query.fetch();
    return this.query.subscribe(() => {
      const result = this.query.getSnapshot();
      if (result.status === "success") {
        this.options.onSuccess?.(result.data);
      }
      if (result.status === "error") {
        this.options.onError?.(result.error);
      }
      listener();
    });
  };

  getSnapshot = () => this.query.getSnapshot();
}
