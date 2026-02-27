/* eslint-disable  @typescript-eslint/no-explicit-any */
import type { EnhancedStore } from "@reduxjs/toolkit";
import type { Api } from "@reduxjs/toolkit/query";
import type { QueryKeyPaths } from "@/src/store/types";

export async function updateEntity(
  mapping: QueryKeyPaths,
  getState: EnhancedStore<any, any, any>["getState"],
  dispatch: EnhancedStore<any, any, any>["dispatch"],
  api: Api<any, any, any, any, any>,
  filterFields: any,
  updatedFields: any,
) {
  const state = getState();
  const queries = state[api.reducerPath].queries;
  await Promise.all(
    Object.entries(queries).map(async ([key, value]) => {
      const argsStartIndex = key.indexOf("(");
      const queryName = key.substring(0, argsStartIndex);
      const queryArgs = (value as any).originalArgs;
      if (mapping[queryName]) {
        const keyPaths = mapping[queryName];
        await dispatch(
          api.util.updateQueryData(
            queryName as any,
            queryArgs,
            (queryDraft: any) => {
              function traverse(item: any, keyPathPart: string[]) {
                if (keyPathPart.length === 0) {
                  if (
                    item &&
                    Object.keys(filterFields).every(
                      (key) => filterFields[key] === item[key],
                    )
                  ) {
                    Object.assign(item, updatedFields);
                  }
                } else {
                  if (keyPathPart[0] === "[]") {
                    for (let i = 0; i < item.length; i++) {
                      traverse(item[i], keyPathPart.slice(1));
                    }
                  } else {
                    traverse(item[keyPathPart[0]], keyPathPart.slice(1));
                  }
                }
              }

              keyPaths.forEach((keyPath) => traverse(queryDraft, keyPath));
            },
          ),
        );
      }
    }),
  );
}
