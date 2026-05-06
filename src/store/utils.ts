/* eslint-disable @typescript-eslint/no-explicit-any */

export function get(root: unknown, path: (string | number)[]): unknown {
  let node: any = root;
  for (const key of path) {
    if (node == null) return undefined;
    node = node[key];
  }
  return node;
}

export function remove(root: unknown, path: (string | number)[]): void {
  if (path.length === 0) return;

  let node: any = root;
  for (let i = 0; i < path.length - 1; i++) {
    if (node == null) return;
    node = node[path[i]];
  }

  const lastKey = path[path.length - 1];
  if (Array.isArray(node) && typeof lastKey === "number") {
    node.splice(lastKey, 1);
  } else {
    node[lastKey] = null;
  }
}

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