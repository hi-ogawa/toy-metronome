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

// todo (react)
// - reactive queryKey

// cf.
// https://tanstack.com/query/v5/docs/react/reference/QueryClient
// https://tanstack.com/query/v5/docs/react/reference/QueryCache

//
// react adapter
//

export function useQuery<T>(options: QueryObserverOptions<T>) {
  const [observer] = React.useState(() => new QueryObserver(options));
  React.useSyncExternalStore(
    observer.subscribe,
    observer.getSnapshot,
    observer.getSnapshot
  );
  React.useEffect(() => observer.fetch(), []);
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
        status: "loading";
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
      } = { status: "loading" };

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

  invalidate() {
    this.promise = undefined;
    this.fetch();
  }

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
  listeners = new Set<() => void>();
  query: Query<T>;

  constructor(private options: QueryObserverOptions<T>) {
    this.query = defaultQueryClient.getQuery(this.options);
  }

  fetch() {
    this.query.fetch();
  }

  notify = () => {
    const result = this.query.getSnapshot();
    if (result.status === "success") {
      this.options.onSuccess?.(result.data);
    }
    if (result.status === "error") {
      this.options.onError?.(result.error);
    }
    this.listeners.forEach((l) => l());
  };

  subscribe = (listener: () => void) => {
    const dispose = this.query.subscribe(this.notify);
    this.listeners.add(listener);
    return () => {
      dispose();
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.query.getSnapshot();
}
