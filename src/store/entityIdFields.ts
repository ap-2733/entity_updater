export const entityIdFields = {
  Product: "_id",
  Deal: "_id",
  Review: "_id",
} as const;

export type EntityIdFields = typeof entityIdFields;
