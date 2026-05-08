/* eslint-disable @typescript-eslint/no-explicit-any */
import { Draft } from "immer";
import {
  deleteEntityInternal,
  setupMutationListenersInternal,
  updateEntityInternal,
} from "./utils";
import {
  entityIdFields,
  entityQueries,
  mutationsMap,
  queryMap,
} from "./apiMap";
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { Api } from "@reduxjs/toolkit/query";

export function updateEntity(
  entityType: string,
  id: string | number,
  updater: (entity: Draft<any>) => void,
) {
  return updateEntityInternal(
    entityType,
    id,
    updater,
    "api",
    entityIdFields,
    queryMap,
    entityQueries,
  );
}

export function deleteEntity(entityType: string, id: string | number) {
  return deleteEntityInternal(
    entityType,
    id,
    "api",
    entityIdFields,
    queryMap,
    entityQueries,
  );
}

export function setupMutationListeners(
  listenerMiddleware: ReturnType<typeof createListenerMiddleware>,
  api: Api<any, any, any, any, any>,
) {
  setupMutationListenersInternal(
    listenerMiddleware,
    api,
    entityIdFields,
    mutationsMap,
  );
}
