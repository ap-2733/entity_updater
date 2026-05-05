import { walkEntityType } from "../src/store/walkEntityType";
import {
  user1,
  user2,
  user3,
  repo1,
  repo2,
  team1,
  team2,
  issue1,
  comment1,
  comment2,
  commentWithReply,
  reviewThread1,
  reviewThread2,
} from "./mockData";

function drain(gen: Generator<void>): void {
  while (!gen.next().done) {}
}

describe("walkEntityType", () => {
  describe("User – getUsers / getUsersSearch", () => {
    it("reports matching user with keyPath [cacheKey, index]", () => {
      const cacheKey = 'getUsers({"skip":0})';
      const queries = {
        [cacheKey]: { endpointName: "getUsers", data: [user1, user3] },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "User",
          user1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: user1, keyPath: [cacheKey, 0] }]);
    });

    it("does not report users whose id does not match", () => {
      const cacheKey = "getUsers({})";
      const queries = {
        [cacheKey]: { endpointName: "getUsers", data: [user1, user3] },
      };
      const items: unknown[] = [];

      drain(
        walkEntityType("User", user1._id, queries, (item) => items.push(item), Infinity),
      );

      expect(items).toEqual([user1]);
    });

    it("getUsersSearch uses the same traversal as getUsers", () => {
      const cacheKey = 'getUsersSearch({"q":"carol"})';
      const queries = {
        [cacheKey]: { endpointName: "getUsersSearch", data: [user3] },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "User",
          user3._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: user3, keyPath: [cacheKey, 0] }]);
    });

    it("finds the same user at both its direct position and inside followers", () => {
      const cacheKey = "getUsers({})";
      const queries = {
        [cacheKey]: { endpointName: "getUsers", data: [user1, user2] },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "User",
          user1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([
        { item: user1, keyPath: [cacheKey, 0] },
        { item: user1, keyPath: [cacheKey, 1, "followers", 0] },
      ]);
    });

    it("finds a user that only appears via followers", () => {
      const cacheKey = "getUsers({})";
      const queries = {
        [cacheKey]: { endpointName: "getUsers", data: [user2] },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "User",
          user1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([
        { item: user1, keyPath: [cacheKey, 0, "followers", 0] },
      ]);
    });
  });

  describe("User – getUsersById", () => {
    it("reports the matching user at keyPath [cacheKey, 'user']", () => {
      const cacheKey = 'getUsersById({"id":"u1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getUsersById",
          data: { user: user1, followers: [], following: [] },
        },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "User",
          user1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: user1, keyPath: [cacheKey, "user"] }]);
    });

    it("reports a user from the followers array at [cacheKey, 'followers', index]", () => {
      const cacheKey = 'getUsersById({"id":"u3"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getUsersById",
          data: { user: user3, followers: [user1], following: [] },
        },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "User",
          user1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: user1, keyPath: [cacheKey, "followers", 0] }]);
    });

    it("reports nothing when the user id does not match", () => {
      const cacheKey = 'getUsersById({"id":"u1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getUsersById",
          data: { user: user1, followers: [], following: [] },
        },
      };
      const callback = jest.fn();

      drain(walkEntityType("User", "nonexistent-id", queries, callback, Infinity));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("Repository – getRepositories / getUsersByIdRepositories", () => {
    it("reports matching repository with keyPath [cacheKey, index]", () => {
      const cacheKey = "getRepositories({})";
      const queries = {
        [cacheKey]: { endpointName: "getRepositories", data: [repo1] },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Repository",
          repo1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: repo1, keyPath: [cacheKey, 0] }]);
    });

    it("finds a repository that only appears via parentFork", () => {
      const cacheKey = "getRepositories({})";
      const queries = {
        [cacheKey]: { endpointName: "getRepositories", data: [repo2] },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Repository",
          repo1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([
        { item: repo1, keyPath: [cacheKey, 0, "parentFork"] },
      ]);
    });
  });

  describe("Team – getTeams / getUsersByIdTeams", () => {
    it("reports matching team with keyPath [cacheKey, index]", () => {
      const cacheKey = "getTeams(undefined)";
      const queries = {
        [cacheKey]: { endpointName: "getTeams", data: [team1] },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Team",
          team1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: team1, keyPath: [cacheKey, 0] }]);
    });

    it("finds a team nested in subTeams", () => {
      const cacheKey = "getTeams(undefined)";
      const queries = {
        [cacheKey]: { endpointName: "getTeams", data: [team2] },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Team",
          team1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([
        { item: team1, keyPath: [cacheKey, 0, "subTeams", 0] },
      ]);
    });
  });

  describe("Team – getTeamsById", () => {
    it("reports the matching team at keyPath [cacheKey, 'team']", () => {
      const cacheKey = 'getTeamsById({"id":"t1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getTeamsById",
          data: { team: team1, subTeams: [], members: [], repositories: [] },
        },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Team",
          team1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: team1, keyPath: [cacheKey, "team"] }]);
    });

    it("finds a subTeam at [cacheKey, 'subTeams', index]", () => {
      const cacheKey = 'getTeamsById({"id":"t2"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getTeamsById",
          data: { subTeams: [team1] },
        },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Team",
          team1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: team1, keyPath: [cacheKey, "subTeams", 0] }]);
    });
  });

  describe("Issue – getIssuesById", () => {
    it("reports matching issue at keyPath [cacheKey, 'issue']", () => {
      const cacheKey = 'getIssuesById({"id":"i1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getIssuesById",
          data: { issue: issue1, comments: [], linkedPullRequests: [] },
        },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Issue",
          issue1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: issue1, keyPath: [cacheKey, "issue"] }]);
    });

    it("reports nothing when the issue id does not match", () => {
      const cacheKey = 'getIssuesById({"id":"i1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getIssuesById",
          data: { issue: issue1, comments: [], linkedPullRequests: [] },
        },
      };
      const callback = jest.fn();

      drain(walkEntityType("Issue", "nonexistent-id", queries, callback, Infinity));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("Comment – getIssuesById", () => {
    it("reports matching comment at keyPath [cacheKey, 'comments', index]", () => {
      const cacheKey = 'getIssuesById({"id":"i1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getIssuesById",
          data: { issue: issue1, comments: [comment1, comment2], linkedPullRequests: [] },
        },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Comment",
          comment2._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: comment2, keyPath: [cacheKey, "comments", 1] }]);
    });

    it("does not report the issue field when searching for Comment", () => {
      const cacheKey = 'getIssuesById({"id":"i1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getIssuesById",
          data: { issue: issue1, comments: [comment1] },
        },
      };
      const items: unknown[] = [];

      drain(
        walkEntityType("Comment", comment1._id, queries, (item) => items.push(item), Infinity),
      );

      expect(items).toEqual([comment1]);
    });
  });

  describe("Comment – getCommentsById", () => {
    it("reports the matching comment at keyPath [cacheKey, 'comment']", () => {
      const cacheKey = 'getCommentsById({"id":"c1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getCommentsById",
          data: { comment: comment1, replies: [comment2] },
        },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Comment",
          comment1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: comment1, keyPath: [cacheKey, "comment"] }]);
    });

    it("finds a reply at [cacheKey, 'replies', index]", () => {
      const cacheKey = 'getCommentsById({"id":"c3"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getCommentsById",
          data: { comment: commentWithReply, replies: [] },
        },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Comment",
          comment1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: comment1, keyPath: [cacheKey, "comment", "replies", 0] }]);
    });
  });

  describe("ReviewThread – getPullRequestsByIdReviews", () => {
    it("reports matching review thread with keyPath [cacheKey, index]", () => {
      const cacheKey = 'getPullRequestsByIdReviews({"id":"pr1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getPullRequestsByIdReviews",
          data: [reviewThread1, reviewThread2],
        },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "ReviewThread",
          reviewThread2._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: reviewThread2, keyPath: [cacheKey, 1] }]);
    });

    it("does not report review threads when searching for Issue", () => {
      const cacheKey = 'getPullRequestsByIdReviews({"id":"pr1"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getPullRequestsByIdReviews",
          data: [reviewThread1],
        },
      };
      const callback = jest.fn();

      drain(walkEntityType("Issue", issue1._id, queries, callback, Infinity));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("multiple cache entries", () => {
    it("finds the same entity in every cache entry that contains it", () => {
      const key1 = 'getUsers({"skip":0})';
      const key2 = 'getUsersSearch({"q":"alice"})';
      const queries = {
        [key1]: { endpointName: "getUsers", data: [user1] },
        [key2]: { endpointName: "getUsersSearch", data: [user1] },
      };
      const keyPaths: (string | number)[][] = [];

      drain(
        walkEntityType("User", user1._id, queries, (_item, kp) => keyPaths.push(kp), Infinity),
      );

      expect(keyPaths).toEqual([
        [key1, 0],
        [key2, 0],
      ]);
    });
  });

  describe("edge cases", () => {
    it("skips queries with null data", () => {
      const queries = { key: { endpointName: "getUsers", data: null } };
      const callback = jest.fn();

      drain(walkEntityType("User", user1._id, queries, callback, Infinity));

      expect(callback).not.toHaveBeenCalled();
    });

    it("skips queries whose endpointName does not match the requested type", () => {
      const queries = {
        key: { endpointName: "getPullRequestsByIdReviews", data: [reviewThread1] },
      };
      const callback = jest.fn();

      drain(walkEntityType("Issue", issue1._id, queries, callback, Infinity));

      expect(callback).not.toHaveBeenCalled();
    });

    it("handles an empty data array", () => {
      const queries = { key: { endpointName: "getUsers", data: [] } };
      const callback = jest.fn();

      drain(walkEntityType("User", user1._id, queries, callback, Infinity));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("timeout / yield", () => {
    it("completes in a single next() call when timeout is ample", () => {
      const queries = { key: { endpointName: "getUsers", data: [user1] } };
      const gen = walkEntityType("User", user1._id, queries, jest.fn(), Infinity);

      expect(gen.next().done).toBe(true);
    });

    it("yields (done=false) when performance.now exceeds deadline", () => {
      const spy = jest.spyOn(performance, "now")
        .mockReturnValueOnce(0)
        .mockReturnValue(100);

      const queries = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [
          `key${i}`,
          { endpointName: "getUsers", data: [] },
        ]),
      );
      const gen = walkEntityType("User", user1._id, queries, jest.fn(), 1);

      expect(gen.next().done).toBe(false);

      spy.mockRestore();
    });

    it("resumes after yield and completes with the full result", () => {
      const spy = jest.spyOn(performance, "now")
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
      const gen = walkEntityType(
        "User",
        user1._id,
        queries,
        (item) => found.push(item._id),
        1,
      );

      const r1 = gen.next();
      expect(r1.done).toBe(false);
      expect(found).toHaveLength(0);

      const r2 = gen.next();
      expect(r2.done).toBe(true);
      expect(found).toEqual([user1._id]);

      spy.mockRestore();
    });
  });
});