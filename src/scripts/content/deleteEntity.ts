/* eslint-disable @typescript-eslint/no-explicit-any */
import { findEntity } from "./findEntity";
import { promisifyGenerator } from "./utils";

export function deleteEntity(
  entityType: Parameters<typeof findEntity>[0],
  id: string | number,
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
      dispatch({
        type: "api/queries/entitiesDeleted",
        payload: { keyPaths },
      });
    }
  };
}
