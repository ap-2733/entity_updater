export const entityIdFields = {
  User: "_id",
  Repository: "_id",
  Team: "_id",
  Issue: "_id",
  Comment: "_id",
  PullRequest: "_id",
  Commit: "_id",
  ReviewThread: "_id",
} as const;

export type EntityIdFields = typeof entityIdFields;
