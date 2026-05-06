import { emptySplitApi as api } from "./emptyApi";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<GetUsersApiResponse, GetUsersApiArg>({
      query: (queryArg) => ({
        url: `/users`,
        params: {
          skip: queryArg.skip,
          limit: queryArg.limit,
        },
      }),
    }),
    getUsersSearch: build.query<
      GetUsersSearchApiResponse,
      GetUsersSearchApiArg
    >({
      query: (queryArg) => ({
        url: `/users/search`,
        params: {
          q: queryArg.q,
        },
      }),
    }),
    getUsersById: build.query<GetUsersByIdApiResponse, GetUsersByIdApiArg>({
      query: (queryArg) => ({ url: `/users/${queryArg.id}` }),
    }),
    patchUsersById: build.mutation<
      PatchUsersByIdApiResponse,
      PatchUsersByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/users/${queryArg.id}`,
        method: "PATCH",
        body: queryArg.body,
      }),
    }),
    getUsersByIdRepositories: build.query<
      GetUsersByIdRepositoriesApiResponse,
      GetUsersByIdRepositoriesApiArg
    >({
      query: (queryArg) => ({ url: `/users/${queryArg.id}/repositories` }),
    }),
    getUsersByIdTeams: build.query<
      GetUsersByIdTeamsApiResponse,
      GetUsersByIdTeamsApiArg
    >({
      query: (queryArg) => ({ url: `/users/${queryArg.id}/teams` }),
    }),
    getUsersByIdIssues: build.query<
      GetUsersByIdIssuesApiResponse,
      GetUsersByIdIssuesApiArg
    >({
      query: (queryArg) => ({
        url: `/users/${queryArg.id}/issues`,
        params: {
          state: queryArg.state,
        },
      }),
    }),
    getUsersByIdPullRequests: build.query<
      GetUsersByIdPullRequestsApiResponse,
      GetUsersByIdPullRequestsApiArg
    >({
      query: (queryArg) => ({
        url: `/users/${queryArg.id}/pullRequests`,
        params: {
          state: queryArg.state,
        },
      }),
    }),
    getRepositories: build.query<
      GetRepositoriesApiResponse,
      GetRepositoriesApiArg
    >({
      query: (queryArg) => ({
        url: `/repositories`,
        params: {
          skip: queryArg.skip,
          limit: queryArg.limit,
        },
      }),
    }),
    getRepositoriesSearch: build.query<
      GetRepositoriesSearchApiResponse,
      GetRepositoriesSearchApiArg
    >({
      query: (queryArg) => ({
        url: `/repositories/search`,
        params: {
          q: queryArg.q,
          language: queryArg.language,
        },
      }),
    }),
    getRepositoriesById: build.query<
      GetRepositoriesByIdApiResponse,
      GetRepositoriesByIdApiArg
    >({
      query: (queryArg) => ({ url: `/repositories/${queryArg.id}` }),
    }),
    patchRepositoriesById: build.mutation<
      PatchRepositoriesByIdApiResponse,
      PatchRepositoriesByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/repositories/${queryArg.id}`,
        method: "PATCH",
        body: queryArg.body,
      }),
    }),
    getRepositoriesByIdStargazers: build.query<
      GetRepositoriesByIdStargazersApiResponse,
      GetRepositoriesByIdStargazersApiArg
    >({
      query: (queryArg) => ({ url: `/repositories/${queryArg.id}/stargazers` }),
    }),
    getRepositoriesByIdIssues: build.query<
      GetRepositoriesByIdIssuesApiResponse,
      GetRepositoriesByIdIssuesApiArg
    >({
      query: (queryArg) => ({
        url: `/repositories/${queryArg.id}/issues`,
        params: {
          state: queryArg.state,
          label: queryArg.label,
        },
      }),
    }),
    getRepositoriesByIdPullRequests: build.query<
      GetRepositoriesByIdPullRequestsApiResponse,
      GetRepositoriesByIdPullRequestsApiArg
    >({
      query: (queryArg) => ({
        url: `/repositories/${queryArg.id}/pullRequests`,
        params: {
          state: queryArg.state,
        },
      }),
    }),
    getRepositoriesByIdCommits: build.query<
      GetRepositoriesByIdCommitsApiResponse,
      GetRepositoriesByIdCommitsApiArg
    >({
      query: (queryArg) => ({
        url: `/repositories/${queryArg.id}/commits`,
        params: {
          branch: queryArg.branch,
          author: queryArg.author,
        },
      }),
    }),
    getIssues: build.query<GetIssuesApiResponse, GetIssuesApiArg>({
      query: (queryArg) => ({
        url: `/issues`,
        params: {
          skip: queryArg.skip,
          limit: queryArg.limit,
        },
      }),
    }),
    getIssuesSearch: build.query<
      GetIssuesSearchApiResponse,
      GetIssuesSearchApiArg
    >({
      query: (queryArg) => ({
        url: `/issues/search`,
        params: {
          q: queryArg.q,
          state: queryArg.state,
        },
      }),
    }),
    getIssuesById: build.query<GetIssuesByIdApiResponse, GetIssuesByIdApiArg>({
      query: (queryArg) => ({ url: `/issues/${queryArg.id}` }),
    }),
    putIssuesById: build.mutation<
      PutIssuesByIdApiResponse,
      PutIssuesByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/issues/${queryArg.id}`,
        method: "PUT",
        body: queryArg.issue,
      }),
    }),
    patchIssuesById: build.mutation<
      PatchIssuesByIdApiResponse,
      PatchIssuesByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/issues/${queryArg.id}`,
        method: "PATCH",
        body: queryArg.body,
      }),
    }),
    getPullRequests: build.query<
      GetPullRequestsApiResponse,
      GetPullRequestsApiArg
    >({
      query: (queryArg) => ({
        url: `/pullRequests`,
        params: {
          skip: queryArg.skip,
          limit: queryArg.limit,
        },
      }),
    }),
    getPullRequestsById: build.query<
      GetPullRequestsByIdApiResponse,
      GetPullRequestsByIdApiArg
    >({
      query: (queryArg) => ({ url: `/pullRequests/${queryArg.id}` }),
    }),
    putPullRequestsById: build.mutation<
      PutPullRequestsByIdApiResponse,
      PutPullRequestsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/pullRequests/${queryArg.id}`,
        method: "PUT",
        body: queryArg.pullRequest,
      }),
    }),
    patchPullRequestsById: build.mutation<
      PatchPullRequestsByIdApiResponse,
      PatchPullRequestsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/pullRequests/${queryArg.id}`,
        method: "PATCH",
        body: queryArg.body,
      }),
    }),
    getPullRequestsByIdReviews: build.query<
      GetPullRequestsByIdReviewsApiResponse,
      GetPullRequestsByIdReviewsApiArg
    >({
      query: (queryArg) => ({ url: `/pullRequests/${queryArg.id}/reviews` }),
    }),
    getTeams: build.query<GetTeamsApiResponse, GetTeamsApiArg>({
      query: () => ({ url: `/teams` }),
    }),
    getTeamsById: build.query<GetTeamsByIdApiResponse, GetTeamsByIdApiArg>({
      query: (queryArg) => ({ url: `/teams/${queryArg.id}` }),
    }),
    getCommitsById: build.query<
      GetCommitsByIdApiResponse,
      GetCommitsByIdApiArg
    >({
      query: (queryArg) => ({ url: `/commits/${queryArg.id}` }),
    }),
    getCommentsById: build.query<
      GetCommentsByIdApiResponse,
      GetCommentsByIdApiArg
    >({
      query: (queryArg) => ({ url: `/comments/${queryArg.id}` }),
    }),
    postIssuesByIdComments: build.mutation<
      PostIssuesByIdCommentsApiResponse,
      PostIssuesByIdCommentsApiArg
    >({
      query: (queryArg) => ({
        url: `/issues/${queryArg.id}/comments`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postPullRequestsByIdComments: build.mutation<
      PostPullRequestsByIdCommentsApiResponse,
      PostPullRequestsByIdCommentsApiArg
    >({
      query: (queryArg) => ({
        url: `/pullRequests/${queryArg.id}/comments`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as productApi };
export type GetUsersApiResponse = /** status 200 List of users */ User[];
export type GetUsersApiArg = {
  skip?: number;
  limit?: number;
};
export type GetUsersSearchApiResponse = /** status 200 Matching users */ User[];
export type GetUsersSearchApiArg = {
  q: string;
};
export type GetUsersByIdApiResponse = /** status 200 User with social graph */ {
  user?: User;
  followers?: User[];
  following?: User[];
};
export type GetUsersByIdApiArg = {
  id: string;
};
export type PatchUsersByIdApiResponse = /** status 200 Updated user */ User;
export type PatchUsersByIdApiArg = {
  id: string;
  body: {
    username?: string;
    email?: string;
    displayName?: string;
    bio?: string;
    avatar?: string;
  };
};
export type GetUsersByIdRepositoriesApiResponse =
  /** status 200 User repositories */ Repository[];
export type GetUsersByIdRepositoriesApiArg = {
  id: string;
};
export type GetUsersByIdTeamsApiResponse = /** status 200 User teams */ Team[];
export type GetUsersByIdTeamsApiArg = {
  id: string;
};
export type GetUsersByIdIssuesApiResponse =
  /** status 200 User issues */ Issue[];
export type GetUsersByIdIssuesApiArg = {
  id: string;
  state?: "open" | "closed" | "all";
};
export type GetUsersByIdPullRequestsApiResponse =
  /** status 200 User pull requests */ PullRequest[];
export type GetUsersByIdPullRequestsApiArg = {
  id: string;
  state?: "open" | "closed" | "merged" | "all";
};
export type GetRepositoriesApiResponse =
  /** status 200 List of repositories */ Repository[];
export type GetRepositoriesApiArg = {
  skip?: number;
  limit?: number;
};
export type GetRepositoriesSearchApiResponse =
  /** status 200 Matching repositories */ Repository[];
export type GetRepositoriesSearchApiArg = {
  q: string;
  language?: string;
};
export type GetRepositoriesByIdApiResponse =
  /** status 200 Repository with collaborators and forks */ {
    repository?: Repository;
    collaborators?: User[];
    forks?: Repository[];
  };
export type GetRepositoriesByIdApiArg = {
  id: string;
};
export type PatchRepositoriesByIdApiResponse =
  /** status 200 Updated repository */ Repository;
export type PatchRepositoriesByIdApiArg = {
  id: string;
  body: {
    name?: string;
    description?: string;
    isPrivate?: boolean;
    language?: string;
  };
};
export type GetRepositoriesByIdStargazersApiResponse =
  /** status 200 Stargazers */ User[];
export type GetRepositoriesByIdStargazersApiArg = {
  id: string;
};
export type GetRepositoriesByIdIssuesApiResponse =
  /** status 200 Repository issues */ Issue[];
export type GetRepositoriesByIdIssuesApiArg = {
  id: string;
  state?: "open" | "closed" | "all";
  label?: string;
};
export type GetRepositoriesByIdPullRequestsApiResponse =
  /** status 200 Repository pull requests */ PullRequest[];
export type GetRepositoriesByIdPullRequestsApiArg = {
  id: string;
  state?: "open" | "closed" | "merged" | "all";
};
export type GetRepositoriesByIdCommitsApiResponse =
  /** status 200 Repository commits */ Commit[];
export type GetRepositoriesByIdCommitsApiArg = {
  id: string;
  branch?: string;
  author?: string;
};
export type GetIssuesApiResponse = /** status 200 List of issues */ Issue[];
export type GetIssuesApiArg = {
  skip?: number;
  limit?: number;
};
export type GetIssuesSearchApiResponse =
  /** status 200 Matching issues */ Issue[];
export type GetIssuesSearchApiArg = {
  q: string;
  state?: string;
};
export type GetIssuesByIdApiResponse =
  /** status 200 Issue with comments and linked PRs */ {
    issue?: Issue;
    comments?: Comment[];
    linkedPullRequests?: PullRequest[];
  };
export type GetIssuesByIdApiArg = {
  id: string;
};
export type PutIssuesByIdApiResponse = /** status 200 Replaced issue */ Issue;
export type PutIssuesByIdApiArg = {
  id: string;
  issue: Issue;
};
export type PatchIssuesByIdApiResponse = /** status 200 Updated issue */ Issue;
export type PatchIssuesByIdApiArg = {
  id: string;
  body: {
    title?: string;
    body?: string;
    state?: "open" | "closed";
  };
};
export type GetPullRequestsApiResponse =
  /** status 200 List of pull requests */ PullRequest[];
export type GetPullRequestsApiArg = {
  skip?: number;
  limit?: number;
};
export type GetPullRequestsByIdApiResponse =
  /** status 200 Pull request with commits and comments */ {
    pullRequest?: PullRequest;
    commits?: Commit[];
    comments?: Comment[];
  };
export type GetPullRequestsByIdApiArg = {
  id: string;
};
export type PutPullRequestsByIdApiResponse =
  /** status 200 Replaced pull request */ PullRequest;
export type PutPullRequestsByIdApiArg = {
  id: string;
  pullRequest: PullRequest;
};
export type PatchPullRequestsByIdApiResponse =
  /** status 200 Updated pull request */ PullRequest;
export type PatchPullRequestsByIdApiArg = {
  id: string;
  body: {
    title?: string;
    body?: string;
    state?: "open" | "closed" | "merged";
  };
};
export type GetPullRequestsByIdReviewsApiResponse =
  /** status 200 Review threads */ ReviewThread[];
export type GetPullRequestsByIdReviewsApiArg = {
  id: string;
};
export type GetTeamsApiResponse = /** status 200 List of teams */ Team[];
export type GetTeamsApiArg = void;
export type GetTeamsByIdApiResponse =
  /** status 200 Team with members, sub-teams, and repositories */ {
    team?: Team;
    members?: User[];
    subTeams?: Team[];
    repositories?: Repository[];
  };
export type GetTeamsByIdApiArg = {
  id: string;
};
export type GetCommitsByIdApiResponse =
  /** status 200 Commit with co-authors and pull request */ {
    commit?: Commit;
    coAuthors?: User[];
    pullRequest?: PullRequest;
  };
export type GetCommitsByIdApiArg = {
  id: string;
};
export type GetCommentsByIdApiResponse =
  /** status 200 Comment with replies */ {
    comment?: Comment;
    replies?: Comment[];
  };
export type GetCommentsByIdApiArg = {
  id: string;
};
export type PostIssuesByIdCommentsApiResponse =
  /** status 201 Comment created */ Comment;
export type PostIssuesByIdCommentsApiArg = {
  id: string;
  body: {
    body: string;
    parentCommentId?: string;
  };
};
export type PostPullRequestsByIdCommentsApiResponse =
  /** status 201 Comment created */ Comment;
export type PostPullRequestsByIdCommentsApiArg = {
  id: string;
  body: {
    body: string;
    parentCommentId?: string;
  };
};
export type Repository = {
  _id: string;
  name: string;
  fullName?: string;
  description?: string;
  language?: string;
  stars?: number;
  isPrivate?: boolean;
  createdAt?: string;
  owner?: User;
  collaborators?: User[];
  stargazers?: User[];
  forks?: Repository[];
  parentFork?: Repository;
};
export type Team = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  createdAt?: string;
  members?: User[];
  repositories?: Repository[];
  subTeams?: Team[];
  parentTeam?: Team;
};
export type User = {
  _id: string;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  createdAt?: string;
  followers?: User[];
  following?: User[];
  pinnedRepositories?: Repository[];
  starredRepositories?: Repository[];
  teams?: Team[];
};
export type Comment = {
  _id: string;
  body: string;
  createdAt?: string;
  updatedAt?: string;
  author?: User;
  replies?: Comment[];
  parentComment?: Comment;
};
export type Commit = {
  _id: string;
  hash: string;
  message: string;
  createdAt?: string;
  author?: User;
  coAuthors?: User[];
  pullRequest?: PullRequest;
};
export type PullRequest = {
  _id: string;
  title: string;
  body?: string;
  state?: "open" | "closed" | "merged";
  number?: number;
  sourceBranch?: string;
  targetBranch?: string;
  createdAt?: string;
  mergedAt?: string;
  author?: User;
  reviewers?: User[];
  commits?: Commit[];
  comments?: Comment[];
  resolvedIssues?: Issue[];
  repository?: Repository;
};
export type Issue = {
  _id: string;
  title: string;
  body?: string;
  state?: "open" | "closed";
  number?: number;
  createdAt?: string;
  closedAt?: string;
  author?: User;
  assignees?: User[];
  comments?: Comment[];
  linkedPullRequests?: PullRequest[];
  repository?: Repository;
};
export type ReviewThread = {
  _id: string;
  filePath?: string;
  line?: number;
  isResolved?: boolean;
  resolvedBy?: User;
  comments?: Comment[];
  pullRequest?: PullRequest;
};
export const {
  useGetUsersQuery,
  useGetUsersSearchQuery,
  useGetUsersByIdQuery,
  usePatchUsersByIdMutation,
  useGetUsersByIdRepositoriesQuery,
  useGetUsersByIdTeamsQuery,
  useGetUsersByIdIssuesQuery,
  useGetUsersByIdPullRequestsQuery,
  useGetRepositoriesQuery,
  useGetRepositoriesSearchQuery,
  useGetRepositoriesByIdQuery,
  usePatchRepositoriesByIdMutation,
  useGetRepositoriesByIdStargazersQuery,
  useGetRepositoriesByIdIssuesQuery,
  useGetRepositoriesByIdPullRequestsQuery,
  useGetRepositoriesByIdCommitsQuery,
  useGetIssuesQuery,
  useGetIssuesSearchQuery,
  useGetIssuesByIdQuery,
  usePutIssuesByIdMutation,
  usePatchIssuesByIdMutation,
  useGetPullRequestsQuery,
  useGetPullRequestsByIdQuery,
  usePutPullRequestsByIdMutation,
  usePatchPullRequestsByIdMutation,
  useGetPullRequestsByIdReviewsQuery,
  useGetTeamsQuery,
  useGetTeamsByIdQuery,
  useGetCommitsByIdQuery,
  useGetCommentsByIdQuery,
  usePostIssuesByIdCommentsMutation,
  usePostPullRequestsByIdCommentsMutation,
} = injectedRtkApi;
