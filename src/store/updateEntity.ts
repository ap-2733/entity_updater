/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Product, Deal, Review } from "./productApi";
import { updateEntityInternal } from "./updateEntityInternal";

export function updateEntity(payload: {
  typeName: "Product";
  id: string;
  update: (draft: Product) => void;
}): ReturnType<typeof updateEntityInternal>;

export function updateEntity(payload: {
  typeName: "Deal";
  id: string;
  update: (draft: Deal) => void;
}): ReturnType<typeof updateEntityInternal>;

export function updateEntity(payload: {
  typeName: "Review";
  id: string;
  update: (draft: Review) => void;
}): ReturnType<typeof updateEntityInternal>;

export function updateEntity(payload: {
  typeName: string;
  id: string;
  update: (draft: any) => void;
}) {
  return updateEntityInternal(payload);
}
