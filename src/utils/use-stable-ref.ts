import React from "preact/compat";

export function useStableRef<T>(value: T) {
  const ref = React.useRef(value);
  ref.current = value;
  return ref;
}
