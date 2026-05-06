/* eslint-disable @typescript-eslint/no-explicit-any */

export function set<T>(root: T, path: (string | number)[], value: unknown): T {
  if (path.length === 0) return value as T;

  let node: any = root;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const nextKey = path[i + 1];
    if (node[key] == null) {
      node[key] = typeof nextKey === "number" ? [] : {};
    }
    node = node[key];
  }

  node[path[path.length - 1]] = value;
  return root;
}