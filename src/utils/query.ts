import React from "react";

// toy tanstack query for one-shot promise on mount
// cf. https://github.com/TanStack/query/blob/98c0803ff82d124d3f862ae8d207514480019d44/packages/react-query/src/useBaseQuery.ts#L59

export function useAsync<T>(options: QueryOptions<T>) {
  const [observer] = React.useState(() => new QueryObserver(options));

  React.useSyncExternalStore(
    React.useCallback((onStorechange) => observer.subscribe(onStorechange), []),
    () => observer.getCurrentResult()
  );

  React.useEffect(() => observer.fetch(), []);

  return observer.getCurrentResult();
}

type QueryOptions<T> = {
  queryFn: () => Promise<T>;
  onSuccess?: (v: T) => void;
  onError?: (e: unknown) => void;
};

class QueryObserver<T> {
  listeners = new Set<() => void>();
  promise: Promise<T> | undefined;
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

  constructor(private options: QueryOptions<T>) {}

  fetch() {
    if (this.listeners.size === 0 || this.promise) {
      return;
    }
    this.promise = this.options.queryFn();
    this.promise
      .then(
        (data) => {
          this.result = { status: "success", data };
        },
        (error) => {
          this.result = { status: "error", error };
        }
      )
      .finally(() => this.notify());
  }

  notify() {
    if (this.listeners.size === 0) {
      return;
    }
    if (this.result.status === "success") {
      this.options.onSuccess?.(this.result.data);
    }
    if (this.result.status === "error") {
      this.options.onError?.(this.result.error);
    }
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getCurrentResult() {
    return this.result;
  }
}
