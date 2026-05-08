import {
  user1,
  user2,
  user3,
  repo1,
  repo2,
  repo3,
  issue1,
  comment1,
  comment2,
  commentWithReply,
  reviewThread1,
  reviewThread2,
} from "./mockData";

import { findEntityGenerator, promisifyGenerator } from "@/src/scripts/utils";
import {
  entityIdFields,
  entityQueries,
  queryMap,
} from "@/src/store/generated/productApi";

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).requestIdleCallback = (
    cb: (d: { timeRemaining: () => number; didTimeout: boolean }) => void,
  ) => {
    Promise.resolve().then(() =>
      cb({ timeRemaining: () => Infinity, didTimeout: false }),
    );
    return 0;
  };
});

describe("findEntity", () => {
  describe("User – getUsers / getUsersSearch", () => {
    it("reports queryCacheKey and keyPath [index] for a matching user", async () => {
      const cacheKey = 'getUsers({"skip":0})';
      const queries = {
        [cacheKey]: { endpointName: "getUsers", data: [user1, user3] },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] =
        [];

      await promisifyGenerator(
        findEntityGenerator(
          "User",
          user1._id,
          queries,
          (queryCacheKey, keyPath) => results.push({ queryCacheKey, keyPath }),
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(results).toEqual([{ queryCacheKey: cacheKey, keyPath: [0] }]);
    });

    it("reports only the user whose id matches, not others in the same array", async () => {
      const cacheKey = "getUsers({})";
      const queries = {
        [cacheKey]: { endpointName: "getUsers", data: [user1, user3] },
      };
      const callback = jest.fn();

      await promisifyGenerator(
        findEntityGenerator(
          "User",
          user1._id,
          queries,
          callback,
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(cacheKey, [0]);
    });

    it("getUsersSearch uses the same traversal as getUsers", async () => {
      const cacheKey = 'getUsersSearch({"q":"carol"})';
      const queries = {
        [cacheKey]: { endpointName: "getUsersSearch", data: [user3] },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] =
        [];

      await promisifyGenerator(
        findEntityGenerator(
          "User",
          user3._id,
          queries,
          (queryCacheKey, keyPath) => results.push({ queryCacheKey, keyPath }),
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(results).toEqual([{ queryCacheKey: cacheKey, keyPath: [0] }]);
    });

    it("finds the entity at its direct position and inside followers", async () => {
      const cacheKey = "getUsers({})";
      const queries = {
        [cacheKey]: { endpointName: "getUsers", data: [user1, user2] },
      };
      const keyPaths: (string | number)[][] = [];

      await promisifyGenerator(
        findEntityGenerator(
          "User",
          user1._id,
          queries,
          (_key, kp) => keyPaths.push(kp),
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(keyPaths).toEqual([[0], [1, "followers", 0]]);
    });

    it("finds a user that only appears via followers", async () => {
      const cacheKey = "getUsers({})";
      const queries = {
        [cacheKey]: { endpointName: "getUsers", data: [user2] },
      };
      const keyPaths: (string | number)[][] = [];

      await promisifyGenerator(
        findEntityGenerator(
          "User",
          user1._id,
          queries,
          (_key, kp) => keyPaths.push(kp),
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(keyPaths).toEqual([[0, "followers", 0]]);
    });
  });

  describe("User – getUsersById", () => {
    it("reports keyPath ['user'] for a matching user", async () => {
      const cacheKey = 'getUsersById({"id":"u1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getUsersById",
          data: { user: user1, followers: [], following: [] },
        },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] =
        [];

      await promisifyGenerator(
        findEntityGenerator(
          "User",
          user1._id,
          queries,
          (queryCacheKey, keyPath) => results.push({ queryCacheKey, keyPath }),
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(results).toEqual([{ queryCacheKey: cacheKey, keyPath: ["user"] }]);
    });

    it("reports nothing when the user id does not match", async () => {
      const cacheKey = 'getUsersById({"id":"u1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getUsersById",
          data: { user: user1, followers: [], following: [] },
        },
      };
      const callback = jest.fn();

      await promisifyGenerator(
        findEntityGenerator(
          "User",
          "nonexistent-id",
          queries,
          callback,
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(callback).not.toHaveBeenCalled();
    });

    it("finds a user in the followers array", async () => {
      const cacheKey = 'getUsersById({"id":"u3"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getUsersById",
          data: { user: user3, followers: [user1], following: [] },
        },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] =
        [];

      await promisifyGenerator(
        findEntityGenerator(
          "User",
          user1._id,
          queries,
          (queryCacheKey, keyPath) => results.push({ queryCacheKey, keyPath }),
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(results).toEqual([
        { queryCacheKey: cacheKey, keyPath: ["followers", 0] },
      ]);
    });
  });

  describe("Repository – getRepositories", () => {
    it("reports queryCacheKey and keyPath [index] for a matching repository", async () => {
      const cacheKey = "getRepositories({})";
      const queries = {
        [cacheKey]: { endpointName: "getRepositories", data: [repo1, repo3] },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] =
        [];

      await promisifyGenerator(
        findEntityGenerator(
          "Repository",
          repo1._id,
          queries,
          (queryCacheKey, keyPath) => results.push({ queryCacheKey, keyPath }),
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(results).toEqual([{ queryCacheKey: cacheKey, keyPath: [0] }]);
    });

    it("finds a repository that only appears via parentFork", async () => {
      const cacheKey = "getRepositories({})";
      const queries = {
        [cacheKey]: { endpointName: "getRepositories", data: [repo2] },
      };
      const keyPaths: (string | number)[][] = [];

      await promisifyGenerator(
        findEntityGenerator(
          "Repository",
          repo1._id,
          queries,
          (_key, kp) => keyPaths.push(kp),
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(keyPaths).toEqual([[0, "parentFork"]]);
    });
  });

  describe("Repository – getRepositoriesById", () => {
    it("reports keyPath ['repository'] for a matching repository", async () => {
      const cacheKey = 'getRepositoriesById({"id":"r1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getRepositoriesById",
          data: { repository: repo1, collaborators: [], forks: [] },
        },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] =
        [];

      await promisifyGenerator(
        findEntityGenerator(
          "Repository",
          repo1._id,
          queries,
          (queryCacheKey, keyPath) => results.push({ queryCacheKey, keyPath }),
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(results).toEqual([
        { queryCacheKey: cacheKey, keyPath: ["repository"] },
      ]);
    });

    it("finds a fork at ['forks', index]", async () => {
      const cacheKey = 'getRepositoriesById({"id":"r3"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getRepositoriesById",
          data: { repository: repo3, collaborators: [], forks: [repo1] },
        },
      };
      const keyPaths: (string | number)[][] = [];

      await promisifyGenerator(
        findEntityGenerator(
          "Repository",
          repo1._id,
          queries,
          (_key, kp) => keyPaths.push(kp),
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(keyPaths).toEqual([["forks", 0]]);
    });
  });

  describe("ReviewThread – getPullRequestsByIdReviews", () => {
    it("reports queryCacheKey and keyPath [index] for a matching review thread", async () => {
      const cacheKey = 'getPullRequestsByIdReviews({"id":"pr1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getPullRequestsByIdReviews",
          data: [reviewThread1, reviewThread2],
        },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] =
        [];

      await promisifyGenerator(
        findEntityGenerator(
          "ReviewThread",
          reviewThread2._id,
          queries,
          (queryCacheKey, keyPath) => results.push({ queryCacheKey, keyPath }),
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(results).toEqual([{ queryCacheKey: cacheKey, keyPath: [1] }]);
    });

    it("does not report review threads when searching for Issue", async () => {
      const cacheKey = 'getPullRequestsByIdReviews({"id":"pr1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getPullRequestsByIdReviews",
          data: [reviewThread1, reviewThread2],
        },
      };
      const callback = jest.fn();

      await promisifyGenerator(
        findEntityGenerator(
          "Issue",
          issue1._id,
          queries,
          callback,
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("Comment – getIssuesById", () => {
    it("reports keyPath ['comments', index] for a matching comment", async () => {
      const cacheKey = 'getIssuesById({"id":"i1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getIssuesById",
          data: {
            issue: issue1,
            comments: [comment1, comment2],
            linkedPullRequests: [],
          },
        },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] =
        [];

      await promisifyGenerator(
        findEntityGenerator(
          "Comment",
          comment2._id,
          queries,
          (queryCacheKey, keyPath) => results.push({ queryCacheKey, keyPath }),
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(results).toEqual([
        { queryCacheKey: cacheKey, keyPath: ["comments", 1] },
      ]);
    });

    it("finds a comment nested in replies", async () => {
      const cacheKey = 'getIssuesById({"id":"i1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getIssuesById",
          data: {
            issue: issue1,
            comments: [commentWithReply],
            linkedPullRequests: [],
          },
        },
      };
      const keyPaths: (string | number)[][] = [];

      await promisifyGenerator(
        findEntityGenerator(
          "Comment",
          comment1._id,
          queries,
          (_key, kp) => keyPaths.push(kp),
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(keyPaths).toEqual([["comments", 0, "replies", 0]]);
    });
  });

  describe("multiple cache entries", () => {
    it("finds the same entity across all cache entries that contain it", async () => {
      const key1 = 'getUsers({"skip":0})';
      const key2 = 'getUsersSearch({"q":"alice"})';
      const queries = {
        [key1]: { endpointName: "getUsers", data: [user1] },
        [key2]: { endpointName: "getUsersSearch", data: [user1] },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] =
        [];

      await promisifyGenerator(
        findEntityGenerator(
          "User",
          user1._id,
          queries,
          (queryCacheKey, keyPath) => results.push({ queryCacheKey, keyPath }),
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(results).toEqual([
        { queryCacheKey: key1, keyPath: [0] },
        { queryCacheKey: key2, keyPath: [0] },
      ]);
    });

    it("reports both the list query and the by-id query", async () => {
      const key1 = "getUsers({})";
      const key2 = 'getUsersById({"id":"u1"})';
      const queries = {
        [key1]: { endpointName: "getUsers", data: [user1] },
        [key2]: {
          endpointName: "getUsersById",
          data: { user: user1, followers: [], following: [] },
        },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] =
        [];

      await promisifyGenerator(
        findEntityGenerator(
          "User",
          user1._id,
          queries,
          (queryCacheKey, keyPath) => results.push({ queryCacheKey, keyPath }),
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(results).toEqual([
        { queryCacheKey: key1, keyPath: [0] },
        { queryCacheKey: key2, keyPath: ["user"] },
      ]);
    });
  });

  describe("edge cases", () => {
    it("skips queries with null data", async () => {
      const queries = { key: { endpointName: "getUsers", data: null } };
      const callback = jest.fn();

      await promisifyGenerator(
        findEntityGenerator(
          "User",
          user1._id,
          queries,
          callback,
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(callback).not.toHaveBeenCalled();
    });

    it("handles an empty data array", async () => {
      const queries = { key: { endpointName: "getUsers", data: [] } };
      const callback = jest.fn();

      await promisifyGenerator(
        findEntityGenerator(
          "User",
          user1._id,
          queries,
          callback,
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(callback).not.toHaveBeenCalled();
    });

    it("skips queries with an unknown endpointName", async () => {
      const queries = {
        key: { endpointName: "unknownEndpoint", data: [user1] },
      };
      const callback = jest.fn();

      await promisifyGenerator(
        findEntityGenerator(
          "User",
          user1._id,
          queries,
          callback,
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(callback).not.toHaveBeenCalled();
    });

    it("handles getIssuesById with null issue field", async () => {
      const cacheKey = 'getIssuesById({"id":"i1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getIssuesById",
          data: { issue: null, comments: [], linkedPullRequests: [] },
        },
      };
      const callback = jest.fn();

      await promisifyGenerator(
        findEntityGenerator(
          "Issue",
          issue1._id,
          queries,
          callback,
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("timeout / yield", () => {
    it("resolves and finds the entity with ample timeout", async () => {
      const queries = { key: { endpointName: "getUsers", data: [user1] } };
      const found: (string | number)[][] = [];

      await promisifyGenerator(
        findEntityGenerator(
          "User",
          user1._id,
          queries,
          (_key, kp) => found.push(kp),
          Infinity,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(found).toEqual([[0]]);
    });

    it("resolves when the generator yields due to an exceeded deadline", async () => {
      const spy = jest
        .spyOn(performance, "now")
        .mockReturnValueOnce(0)
        .mockReturnValue(100);

      const queries = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [
          `key${i}`,
          { endpointName: "getUsers", data: [] },
        ]),
      );

      await expect(
        promisifyGenerator(
          findEntityGenerator(
            "User",
            user1._id,
            queries,
            jest.fn(),
            1,
            entityIdFields,
            queryMap,
            entityQueries,
          ),
        ),
      ).resolves.toBeUndefined();

      spy.mockRestore();
    });

    it("finds the entity after resuming from a yield", async () => {
      const spy = jest
        .spyOn(performance, "now")
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(100)
        .mockReturnValue(0);

      const queries = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [
          `key${i}`,
          { endpointName: "getUsers", data: i === 999 ? [user1] : [] },
        ]),
      );
      const found: string[] = [];

      await promisifyGenerator(
        findEntityGenerator(
          "User",
          user1._id,
          queries,
          (_key, kp) => found.push(String(kp[0])),
          1,
          entityIdFields,
          queryMap,
          entityQueries,
        ),
      );

      expect(found).toEqual(["0"]);

      spy.mockRestore();
    });
  });
});
