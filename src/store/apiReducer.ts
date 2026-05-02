import type { UnknownAction } from "@reduxjs/toolkit";
import { defaultSerializeQueryArgs } from "@reduxjs/toolkit/query";
import { productApi } from "./productApi";
import { entityLoaded, entityRemoved } from "./entityActions";

function omit<T extends Record<string, unknown>>(obj: T, key: string): T {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key)) as T;
}

// keypaths within a single query cache entry where the entity appears
type KeyPathList = (string | number)[][];

export type EntityMappingState = {
  [entityType: string]: {
    [id: string]: {
      [cacheKey: string]: KeyPathList;
    };
  };
};

export type ApiState = ReturnType<typeof productApi.reducer> & {
  entityMapping: EntityMappingState;
};

export function apiReducer(state: ApiState | undefined, action: UnknownAction): ApiState {
  if (state === undefined) {
    return { ...productApi.reducer(undefined, action), entityMapping: {} };
  }

  const { entityMapping, ...rtkState } = state;
  const nextRtkState = productApi.reducer(
    rtkState as ReturnType<typeof productApi.reducer>,
    action,
  );

  if (entityLoaded.match(action)) {
    let nextEntityMapping = entityMapping;
    for (const { entityType, id, keyPath, queryName, queryArgs } of action.payload) {
      const cacheKey = defaultSerializeQueryArgs({
        endpointName: queryName,
        queryArgs,
        endpointDefinition: {} as never,
      });
      const byType = nextEntityMapping[entityType] ?? {};
      const byId = byType[id] ?? {};
      const byKey = byId[cacheKey] ?? [];
      nextEntityMapping = {
        ...nextEntityMapping,
        [entityType]: {
          ...byType,
          [id]: { ...byId, [cacheKey]: [...byKey, keyPath] },
        },
      };
    }
    return { ...nextRtkState, entityMapping: nextEntityMapping };
  }

  if (entityRemoved.match(action)) {
    let nextEntityMapping = entityMapping;
    for (const { entityType, id, queryCacheKey } of action.payload) {
      const byType = nextEntityMapping[entityType];
      if (!byType) continue;
      const byId = byType[id];
      if (!byId || !(queryCacheKey in byId)) continue;
      const restById = omit(byId, queryCacheKey);
      if (Object.keys(restById).length === 0) {
        const restByType = omit(byType, id);
        nextEntityMapping =
          Object.keys(restByType).length === 0
            ? omit(nextEntityMapping, entityType)
            : { ...nextEntityMapping, [entityType]: restByType };
      } else {
        nextEntityMapping = {
          ...nextEntityMapping,
          [entityType]: { ...byType, [id]: restById },
        };
      }
    }
    return { ...nextRtkState, entityMapping: nextEntityMapping };
  }

  return { ...nextRtkState, entityMapping };
}