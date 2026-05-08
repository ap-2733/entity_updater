/* eslint-disable @typescript-eslint/no-explicit-any */
import { produce } from "immer";
import { remove, set } from "./utils";

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
