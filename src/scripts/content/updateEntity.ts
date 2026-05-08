/* eslint-disable @typescript-eslint/no-explicit-any */
import { findEntity } from "./findEntity";
import { Draft, produce } from "immer";
import { get, promisifyGenerator } from "./utils";

export function updateEntity(
  entityType: Parameters<typeof findEntity>[0],
  id: string | number,
  updater: (entity: Draft<any>) => void,
) {
  return async (dispatch: any, getState: () => any) => {
    const keyPaths: (string | number)[][] = [];
    const state = getState().api.queries as any;
    await promisifyGenerator(
      findEntity(
        entityType,
        id,
        state,
        (queryKey, keypath) => {
          keyPaths.push([queryKey, "data", ...keypath]);
        },
        100,
      ),
    );
    if (keyPaths.length > 0) {
      const updatedEntity = produce(get(state, keyPaths[0]), updater);
      dispatch({
        type: "api/queries/entitiesUpdated",
        payload: { keyPaths, updatedEntity },
      });
    }
  };
}
