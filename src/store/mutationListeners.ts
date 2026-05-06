/* eslint-disable @typescript-eslint/no-explicit-any */
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { productApi } from "./productApi";
import { entityIdFields, mutationsMap } from "./apiMap";
import { updateEntity } from "./updateEntity";
import type { AppDispatch } from "./store";

export const mutationListenerMiddleware = createListenerMiddleware();

for (const [mutationName, entityType] of Object.entries(mutationsMap)) {
  const endpoint =
    productApi.endpoints[mutationName as keyof typeof productApi.endpoints];
  mutationListenerMiddleware.startListening({
    matcher: endpoint.matchFulfilled,
    effect: async (action, listenerApi) => {
      const dispatch = listenerApi.dispatch as AppDispatch;
      const data = action.payload as any;
      const idField = entityIdFields[entityType as keyof typeof entityIdFields];
      const id = data[idField];
      await dispatch(
        updateEntity(entityType as any, id, (entity) => {
          Object.assign(entity, data);
        }),
      );
    },
  });
}