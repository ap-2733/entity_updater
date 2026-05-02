/* eslint-disable  @typescript-eslint/no-explicit-any */
import { produceWithPatches } from "immer";
import { productApi } from "./productApi";
import type { EntityMappingState } from "./apiReducer";

export function updateEntity(payload: {
  typeName: string;
  id: string;
  update: (draft: any) => void;
}) {
  return (dispatch: any, getState: any) => {
    const state = getState();
    const entityMapping = state[productApi.reducerPath]
      .entityMapping as EntityMappingState;
    const byId = entityMapping[payload.typeName]?.[payload.id];
    if (!byId) return;

    for (const [cacheKey, keyPaths] of Object.entries(byId)) {
      const currentData = state[productApi.reducerPath].queries[cacheKey]?.data;
      if (currentData == null) continue;

      const [, patches, inversePatches] = produceWithPatches(
        currentData as Record<string, unknown>,
        (queryDraft: any) => {
          for (const keyPath of keyPaths as (string | number)[][]) {
            let item: any = queryDraft;
            for (const segment of keyPath) {
              if (item == null) break;
              item = item[segment];
            }
            if (item != null) payload.update(item);
          }
        },
      );

      if (patches.length === 0) continue;
      dispatch(
        (productApi.internalActions as any).queryResultPatched({
          queryCacheKey: cacheKey,
          patches,
          inversePatches,
          fromEntityUpdate: true,
        }),
      );
    }
  };
}