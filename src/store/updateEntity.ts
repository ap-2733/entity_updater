/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  User,
  Repository,
  Team,
  Issue,
  Comment,
  PullRequest,
  Commit,
  ReviewThread,
} from "./productApi";
import { updateEntityInternal } from "./updateEntityInternal";

export function updateEntity(payload: {
  typeName: "User";
  id: string;
  update: (draft: User) => void;
}): ReturnType<typeof updateEntityInternal>;

export function updateEntity(payload: {
  typeName: "Repository";
  id: string;
  update: (draft: Repository) => void;
}): ReturnType<typeof updateEntityInternal>;

export function updateEntity(payload: {
  typeName: "Team";
  id: string;
  update: (draft: Team) => void;
}): ReturnType<typeof updateEntityInternal>;

export function updateEntity(payload: {
  typeName: "Issue";
  id: string;
  update: (draft: Issue) => void;
}): ReturnType<typeof updateEntityInternal>;

export function updateEntity(payload: {
  typeName: "Comment";
  id: string;
  update: (draft: Comment) => void;
}): ReturnType<typeof updateEntityInternal>;

export function updateEntity(payload: {
  typeName: "PullRequest";
  id: string;
  update: (draft: PullRequest) => void;
}): ReturnType<typeof updateEntityInternal>;

export function updateEntity(payload: {
  typeName: "Commit";
  id: string;
  update: (draft: Commit) => void;
}): ReturnType<typeof updateEntityInternal>;

export function updateEntity(payload: {
  typeName: "ReviewThread";
  id: string;
  update: (draft: ReviewThread) => void;
}): ReturnType<typeof updateEntityInternal>;

export function updateEntity(payload: {
  typeName: string;
  id: string;
  update: (draft: any) => void;
}) {
  return updateEntityInternal(payload);
}
