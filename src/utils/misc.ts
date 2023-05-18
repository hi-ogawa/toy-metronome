export function identity<T>(v: T): T {
  return v;
}

export function sum(ls: number[]): number {
  return ls.reduce((x, y) => x + y, 0);
}

export function mapValues<T1, T2>(
  record: Record<string, T1>,
  f: (v: T1, k: string) => T2
): Record<string, T2> {
  return Object.fromEntries(
    Object.entries(record).map(([k, v]) => [k, f(v, k)])
  );
}
