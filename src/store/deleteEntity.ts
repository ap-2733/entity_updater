/* eslint-disable @typescript-eslint/no-explicit-any */
import { findEntity } from "@/src/store/findEntity";
import { produceWithPatches } from "immer";
import { AppDispatch, RootState } from "@/src/store/store";
import { promisifyGenerator } from "@/src/store/promisifyGenerator";
import { remove } from "@/src/store/utils";

export function deleteEntity(
  entityType: Parameters<typeof findEntity>[0],
  id: string | number,
) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    await promisifyGenerator(
      findEntity(
        entityType,
        id,
        getState().api.queries as any,
        (queryKey, keypath) => {
          const data = (getState().api.queries as any)[queryKey]["data"] as object;
          const [, patches, invertedPatches] = produceWithPatches(
            data,
            (draft) => {
              remove(draft, keypath);
            },
          );
          dispatch({
            type: "api/queries/queryResultPatched",
            payload: { queryCacheKey: queryKey, patches, invertedPatches },
          });
        },
        100,
      ),
    );
  };
}