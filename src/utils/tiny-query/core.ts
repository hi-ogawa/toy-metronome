export type QueryKey = unknown[];

export function serializeQueryKey(queryKey: QueryKey): string {
  return JSON.stringify(queryKey);
}

interface QueryOptions<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
}

interface QueryCallbackOptions<T> {
  onSuccess?: (v: T) => void;
  onError?: (e: unknown) => void;
}

export interface QueryObserverOptions<T>
  extends QueryOptions<T>,
    QueryCallbackOptions<T> {}

interface QueryClientOptions {
  defaultOptions?: {
    queries?: QueryCallbackOptions<unknown>;
  };
}

export class QueryClient {
  private cache = new Map<string, Query<unknown>>();

  constructor(public options: QueryClientOptions = {}) {}

  build<T>(options: QueryOptions<T>): Query<T> {
    const key = serializeQueryKey(options.queryKey);
    const query = this.cache.get(key) ?? new Query(options.queryFn);
    return query as Query<T>;
  }
}

export class Query<T> {
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

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.result;

  private notify() {
    this.listeners.forEach((f) => f());
  }
}

export class QueryObserver<T> {
  private query: Query<T>;

  constructor(
    private client: QueryClient,
    private options: QueryObserverOptions<T>
  ) {
    this.options = {
      ...client.options.defaultOptions?.queries,
      ...this.options,
    };
    this.query = this.client.build(this.options);
  }

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
