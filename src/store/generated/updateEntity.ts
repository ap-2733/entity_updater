/* eslint-disable @typescript-eslint/no-explicit-any */
import { findEntity } from "@/src/store/generated/findEntity";
import { Draft, produce, produceWithPatches } from "immer";
import { AppDispatch, RootState } from "@/src/store/store";
import { get, promisifyGenerator, set } from "@/src/store/generated/utils";

export function updateEntity(
  entityType: Parameters<typeof findEntity>[0],
  id: string | number,
  updater: (entity: Draft<any>) => void,
) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    await promisifyGenerator(
      findEntity(
        entityType,
        id,
        getState().api.queries as any,
        (queryKey, keypath) => {
          const data = (getState().api.queries as any)[queryKey][
            "data"
          ] as object;
          const entity = get(data, keypath);
          const updatedEntity = produce(entity, updater);
          const [, patches, invertedPatches] = produceWithPatches(
            data,
            (draft) => {
              set(draft, keypath, updatedEntity);
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
