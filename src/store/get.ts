/* eslint-disable @typescript-eslint/no-explicit-any */

export function get(root: unknown, path: (string | number)[]): unknown {
  let node: any = root;
  for (const key of path) {
    if (node == null) return undefined;
    node = node[key];
  }
  return node;
}