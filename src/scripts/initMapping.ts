import type { Mapping } from "./types";

export function initMapping() {
  const mapping: Mapping = {};

  function addMapping(typeName: string, queryName: string, path: string[]) {
    if (!mapping[typeName]) {
      mapping[typeName] = {};
    }

    if (!mapping[typeName][queryName]) {
      mapping[typeName][queryName] = [];
    }

    const existing = mapping[typeName][queryName];

    if (!existing.some((p) => JSON.stringify(p) === JSON.stringify(path))) {
      existing.push(path);
    }
  }

  return { mapping, addMapping };
}
