export const identity = <T>(v: T): T => v;

export const sum = (ls: number[]): number => ls.reduce((x, y) => x + y, 0);
