export const identify = <T>(v: T): T => v;

export const sum = (ls: number[]): number => ls.reduce((x, y) => x + y, 0);

export function objectMapEntries<
  K extends PropertyKey,
  V,
  K2 extends PropertyKey,
  V2
>(o: Record<K, V>, f: (kv: [k: K, v: V]) => [K2, V2]): Record<K2, V2> {
  return Object.fromEntries(Object.entries(o).map((kv) => f(kv as any))) as any;
}

export function objectMapValues<K extends PropertyKey, V, V2>(
  o: Record<K, V>,
  f: (v: V, k: K) => V2
): Record<K, V2> {
  return objectMapEntries(o, ([k, v]) => [k, f(v, k)]);
}

export function objectMapKeys<K extends PropertyKey, V, K2 extends PropertyKey>(
  o: Record<K, V>,
  f: (v: V, k: K) => K2
): Record<K2, V> {
  return objectMapEntries(o, ([k, v]) => [f(v, k), v]);
}
