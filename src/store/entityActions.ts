import { createAction } from "@reduxjs/toolkit";

export const entityLoaded = createAction<
  Array<{
    entityType: string;
    id: string;
    keyPath: (string | number)[];
    queryName: string;
    queryArgs: unknown;
  }>
>("entity/loaded");

export const entityRemoved = createAction<
  Array<{
    entityType: string;
    id: string;
    queryCacheKey: string;
  }>
>("entity/removed");