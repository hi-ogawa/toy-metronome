import { DefaultMap } from "@hiogawa/utils";
import React from "react";

export function useLocalStorage<T>({
  key,
  defaultValue,
  parse = JSON.parse,
  stringify = JSON.stringify,
}: {
  key: string;
  defaultValue: T;
  parse?: (item: string) => T;
  stringify?: (v: T) => string;
}) {
  React.useSyncExternalStore(
    (onStoreChange) => localStorageStore.subscribe(key, onStoreChange),
    () => localStorageStore.get(key)
  );

  const dataRaw = localStorageStore.get(key);
  const data = React.useMemo(() => {
    return dataRaw === null ? defaultValue : parse(dataRaw);
  }, [key, defaultValue, dataRaw]);

  const set = (data: T) => localStorageStore.set(key, stringify(data));

  const remove = () => localStorageStore.remove(key);

  return [data, set, remove] as const;
}

//
// localStorage wrapper for react exteranl store api
//

class LocalStorageStore {
  listeners = new DefaultMap<string, Set<() => void>>(() => new Set());

  setup() {
    const handler = (e: StorageEvent) => {
      // null when clear
      if (e.key === null) {
        this.notifyAll();
      } else {
        this.notify(e.key);
      }
    };
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("storage", handler);
    };
  }

  get(key: string): string | null {
    return window.localStorage.getItem(key);
  }

  set(key: string, data: string) {
    window.localStorage.setItem(key, data);
    this.notify(key);
  }

  remove(key: string) {
    window.localStorage.removeItem(key);
    this.notify(key);
  }

  subscribe(key: string, listener: () => void) {
    this.listeners.get(key).add(listener);
    return () => {
      this.listeners.get(key).delete(listener);
    };
  }

  private notify(key: string) {
    this.listeners.get(key).forEach((l) => l());
  }

  private notifyAll() {
    this.listeners.forEach((set) => set.forEach((l) => l()));
  }
}

// unique global instance
export const localStorageStore = new LocalStorageStore();

localStorageStore.setup();
