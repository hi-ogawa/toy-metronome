import { useRef } from "@hiogawa/tiny-react";

export function useStableRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
