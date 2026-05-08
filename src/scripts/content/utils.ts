/* eslint-disable @typescript-eslint/no-explicit-any */

import { Draft, produce } from "immer";
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { Api } from "@reduxjs/toolkit/query";

export function get(root: unknown, path: (string | number)[]): unknown {
  let node: any = root;
  for (const key of path) {
    if (node == null) return undefined;
    node = node[key];
  }
  return node;
}

function remove(root: unknown, path: (string | number)[]): void {
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

function set<T>(root: T, path: (string | number)[], value: unknown): T {
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

type IdleGenerator<T> = Generator<void, T, number>;

interface PromisifyGeneratorOptions {
  timeout?: number;
}

/**
 * Runs a generator incrementally using requestIdleCallback until completion.
 */
export function promisifyGenerator(
  generator: IdleGenerator<void>,
  options?: PromisifyGeneratorOptions,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    function run(deadline: IdleDeadline): void {
      try {
        let timeRemaining = deadline.timeRemaining();
        while (timeRemaining > 0 || deadline.didTimeout) {
          const result = generator.next(timeRemaining);

          if (result.done) {
            resolve();
            return;
          }
          timeRemaining = deadline.timeRemaining();
        }
        requestIdleCallback(run, {
          timeout: options?.timeout,
        });
      } catch (error) {
        reject(error);
      }
    }

    requestIdleCallback(run, {
      timeout: options?.timeout,
    });
  });
}

type AnyReducer = (state: any, action: any) => any;

export function wrapApiReducer<T extends AnyReducer>(baseReducer: T): T {
  return function (state: any, action: any): any {
    const nextState = baseReducer(state, action);

    switch (action.type) {
      case "api/queries/entitiesUpdated": {
        const { keyPaths, updatedEntity } = action.payload as {
          keyPaths: (string | number)[][];
          updatedEntity: unknown;
        };
        return produce(nextState, (draft: any) => {
          for (const keyPath of keyPaths) {
            set(draft.queries, keyPath, updatedEntity);
          }
        });
      }
      case "api/queries/entitiesDeleted": {
        const { keyPaths } = action.payload as {
          keyPaths: (string | number)[][];
        };
        return produce(nextState, (draft: any) => {
          for (const keyPath of keyPaths) {
            remove(draft.queries, keyPath);
          }
        });
      }
      default:
        return nextState;
    }
  } as unknown as T;
}

// type EntityTypeName = keyof EntityIdFields;
type StackItem = {
  data: any;
  shape: string | Record<string, string>;
  path: (string | number)[];
};

export async function findEntity(
  typeName: string,
  id: string | number,
  state: any,
  reducerPath: string,
  entityIdFields: Record<string, string>,
  queryMap: any,
  entityQueries: Record<string, string[]>,
) {
  const keyPaths: (string | number)[][] = [];
  const queriesState = state[reducerPath].queries as any;
  await promisifyGenerator(
    findEntityGenerator(
      typeName,
      id,
      queriesState,
      (queryKey, keypath) => {
        keyPaths.push([queryKey, "data", ...keypath]);
      },
      100,
      entityIdFields,
      queryMap,
      entityQueries,
    ),
  );
  return keyPaths;
}

export function* findEntityGenerator(
  typeName: string,
  id: string | number,
  queries: Record<string, { endpointName: string; data: unknown }>,
  callback: (queryCacheKey: string, keyPath: (string | number)[]) => void,
  timeoutMs: number,
  entityIdFields: Record<string, string>,
  queryMap: any,
  entityQueries: Record<string, string[]>,
): Generator<void> {
  const idField = entityIdFields[typeName];
  let deadline = Date.now() + timeoutMs;
  let counter = 0;
  const entityShape = (queryMap as any)[typeName] as
    | Record<string, string>
    | undefined;
  const relevantEndpoints = new Set(entityQueries[typeName] ?? []);
  const stack: StackItem[] = [];

  for (const [queryCacheKey, query] of Object.entries(queries)) {
    if (++counter % 1000 === 0) {
      const now = Date.now();
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
        const now = Date.now();
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
                const now = Date.now();
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
            const now = Date.now();
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

export function deleteEntityInternal(
  entityType: string,
  id: string | number,
  reducerPath: string,
  entityIdFields: Record<string, string>,
  queryMap: any,
  entityQueries: Record<string, string[]>,
) {
  return async (dispatch: any, getState: () => any) => {
    const state = getState();
    const keyPaths = await findEntity(
      entityType,
      id,
      state,
      reducerPath,
      entityIdFields,
      queryMap,
      entityQueries,
    );
    if (keyPaths.length > 0) {
      dispatch({
        type: "api/queries/entitiesDeleted",
        payload: { keyPaths },
      });
    }
  };
}

export function updateEntityInternal(
  entityType: Parameters<typeof findEntityGenerator>[0],
  id: string | number,
  updater: (entity: Draft<any>) => void,
  reducerPath: string,
  entityIdFields: Record<string, string>,
  queryMap: any,
  entityQueries: Record<string, string[]>,
) {
  return async (dispatch: any, getState: () => any) => {
    const state = getState();
    const queriesState = getState()[reducerPath].queries as any;
    const keyPaths = await findEntity(
      entityType,
      id,
      state,
      reducerPath,
      entityIdFields,
      queryMap,
      entityQueries,
    );
    if (keyPaths.length > 0) {
      const updatedEntity = produce(get(queriesState, keyPaths[0]), updater);
      dispatch({
        type: "api/queries/entitiesUpdated",
        payload: { keyPaths, updatedEntity },
      });
    }
  };
}

export function setupMutationListenersInternal(
  listenerMiddleware: ReturnType<typeof createListenerMiddleware>,
  api: Api<any, any, any, any, any>,
  entityIdFields: Record<string, string>,
  mutationsMap: Record<string, string>,
  reducerPath: string,
  queryMap: any,
  entityQueries: Record<string, string[]>,
) {
  for (const [mutationName, entityType] of Object.entries(mutationsMap)) {
    const endpoint = api.endpoints[mutationName];
    listenerMiddleware.startListening({
      matcher: endpoint.matchFulfilled,
      effect: async (action, listenerApi) => {
        const dispatch = listenerApi.dispatch as any;
        const data = (action as any).payload;
        const idField = entityIdFields[entityType];
        const id = data[idField];
        await dispatch(
          updateEntityInternal(
            entityType,
            id,
            (entity: any) => {
              Object.assign(entity, data);
            },
            reducerPath,
            entityIdFields,
            queryMap,
            entityQueries,
          ),
        );
      },
    });
  }
}
