/* eslint-disable @typescript-eslint/no-explicit-any */
import { queryMap, entityIdFields, entityQueries, EntityIdFields } from "./apiMap";

type EntityTypeName = keyof EntityIdFields;

type StackItem = {
  data: any;
  shape: string | Record<string, string>;
  path: (string | number)[];
};

export function* findEntity(
  typeName: EntityTypeName,
  id: string | number,
  queries: Record<string, { endpointName: string; data: unknown }>,
  callback: (queryCacheKey: string, keyPath: (string | number)[]) => void,
  timeoutMs: number,
): Generator<void> {
  const idField = entityIdFields[typeName];
  let deadline = performance.now() + timeoutMs;
  let counter = 0;
  const entityShape = (queryMap as any)[typeName] as
    | Record<string, string>
    | undefined;
  const relevantEndpoints = new Set(entityQueries[typeName] ?? []);
  const stack: StackItem[] = [];

  for (const [queryCacheKey, query] of Object.entries(queries)) {
    if (++counter % 1000 === 0) {
      const now = performance.now();
      if (now > deadline) {
        deadline = now + timeoutMs;
        timeoutMs = yield;
      }
    }
    if (!query.data) continue;
    if (!relevantEndpoints.has(query.endpointName)) continue;
    const queryShape = (queryMap as any)[query.endpointName] as
      | string
      | Record<string, string>
      | undefined;
    if (!queryShape) continue;

    stack.length = 0;
    stack.push({ data: query.data, shape: queryShape, path: [] });

    while (stack.length > 0) {
      if (++counter % 1000 === 0) {
        const now = performance.now();
        if (now > deadline) {
          deadline = now + timeoutMs;
          timeoutMs = yield;
        }
      }
      const { data, shape, path } = stack.pop()!;

      if (typeof shape === "string") {
        if (shape === typeName) {
          if (data != null && data[idField] === id) {
            callback(queryCacheKey, path);
          }
          if (data != null && entityShape) {
            stack.push({ data, shape: entityShape, path });
          }
        } else if (shape.endsWith("[]")) {
          if (Array.isArray(data)) {
            const elementShape = shape.slice(0, -2);
            for (let i = data.length - 1; i >= 0; i--) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                data: data[i],
                shape: elementShape,
                path: [...path, i],
              });
            }
          }
        } else {
          const otherShape = (queryMap as any)[shape] as
            | Record<string, string>
            | undefined;
          if (otherShape && data != null) {
            stack.push({ data, shape: otherShape, path });
          }
        }
      } else {
        const fields = Object.entries(shape);
        for (let i = fields.length - 1; i >= 0; i--) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const [field, fieldShape] = fields[i];
          stack.push({
            data: data?.[field],
            shape: fieldShape,
            path: [...path, field],
          });
        }
      }
    }
  }
}