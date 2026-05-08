/* eslint-disable @typescript-eslint/no-explicit-any */
import { RootState } from "../src/store/store";
import { user1, user2, user3, repo1, repo2 } from "./mockData";
import { deleteEntity } from "@/src/store/generated/productApi";

beforeEach(() => {
  (global as any).requestIdleCallback = (
    cb: (d: { timeRemaining: () => number; didTimeout: boolean }) => void,
  ) => {
    Promise.resolve().then(() =>
      cb({ timeRemaining: () => Infinity, didTimeout: false }),
    );
    return 0;
  };
});

function makeMockStore(
  queries: Record<string, { endpointName: string; data: unknown }>,
) {
  const dispatch = jest.fn();
  const getState = () => ({ api: { queries } }) as unknown as RootState;
  return { dispatch, getState };
}

describe("deleteEntity", () => {
  describe("dispatching", () => {
    it("dispatches queryResultsDeleted with the correct action type", async () => {
      const cacheKey = "getUsers({})";
      const { dispatch, getState } = makeMockStore({
        [cacheKey]: { endpointName: "getUsers", data: [user1, user3] },
      });

      await deleteEntity("User", user1._id)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "api/queries/entitiesDeleted",
        }),
      );
    });

    it("does not dispatch when the entity is not found", async () => {
      const { dispatch, getState } = makeMockStore({
        "getUsers({})": { endpointName: "getUsers", data: [user3] },
      });

      await deleteEntity("User", user1._id)(dispatch, getState);

      expect(dispatch).not.toHaveBeenCalled();
    });

    it("dispatches once with keyPaths for all cache entries that contain the entity", async () => {
      const key1 = "getUsers({})";
      const key2 = 'getUsersSearch({"q":"alice"})';
      const { dispatch, getState } = makeMockStore({
        [key1]: { endpointName: "getUsers", data: [user1] },
        [key2]: { endpointName: "getUsersSearch", data: [user1] },
      });

      await deleteEntity("User", user1._id)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledTimes(1);
      const { keyPaths } = dispatch.mock.calls[0][0].payload;
      const cacheKeys = keyPaths.map(([key]: (string | number)[]) => key);
      expect(cacheKeys).toEqual(expect.arrayContaining([key1, key2]));
    });

    it("dispatches once with multiple keyPaths when entity appears multiple times in a single entry", async () => {
      // user1 appears at [0] directly and at [1, 'followers', 0] inside user2
      const { dispatch, getState } = makeMockStore({
        "getUsers({})": { endpointName: "getUsers", data: [user1, user2] },
      });

      await deleteEntity("User", user1._id)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledTimes(1);
      const { keyPaths } = dispatch.mock.calls[0][0].payload;
      expect(keyPaths).toHaveLength(2);
    });
  });

  describe("payload correctness", () => {
    it("keyPaths entry for an array element includes queryCacheKey, 'data', and the index", async () => {
      const cacheKey = "getUsers({})";
      const { dispatch, getState } = makeMockStore({
        [cacheKey]: { endpointName: "getUsers", data: [user1, user3] },
      });

      await deleteEntity("User", user1._id)(dispatch, getState);

      const { keyPaths } = dispatch.mock.calls[0][0].payload;
      expect(keyPaths).toHaveLength(1);
      expect(keyPaths[0]).toEqual([cacheKey, "data", 0]);
    });

    it("keyPaths entry for a nested array element includes the full keypath", async () => {
      // user1 only appears nested inside user2's followers, not at the top level
      const cacheKey = "getUsers({})";
      const { dispatch, getState } = makeMockStore({
        [cacheKey]: {
          endpointName: "getUsers",
          data: [{ ...user2, followers: [{ ...user1 }] }],
        },
      });

      await deleteEntity("User", user1._id)(dispatch, getState);

      const { keyPaths } = dispatch.mock.calls[0][0].payload;
      expect(keyPaths).toHaveLength(1);
      expect(keyPaths[0]).toEqual([cacheKey, "data", 0, "followers", 0]);
    });

    it("keyPaths entry for a property reference includes the full keypath to that property", async () => {
      const cacheKey = 'getRepositoriesById({"id":"r2"})';
      const { dispatch, getState } = makeMockStore({
        [cacheKey]: {
          endpointName: "getRepositoriesById",
          data: {
            repository: { ...repo2, parentFork: { ...repo1 } },
            collaborators: [],
            forks: [],
          },
        },
      });

      await deleteEntity("Repository", repo1._id)(dispatch, getState);

      const { keyPaths } = dispatch.mock.calls[0][0].payload;
      expect(keyPaths).toHaveLength(1);
      expect(keyPaths[0]).toEqual([
        cacheKey,
        "data",
        "repository",
        "parentFork",
      ]);
    });

    it("does not include keyPaths for unrelated entities", async () => {
      const { dispatch, getState } = makeMockStore({
        "getUsers({})": { endpointName: "getUsers", data: [user1, user3] },
      });

      await deleteEntity("User", user1._id)(dispatch, getState);

      const { keyPaths } = dispatch.mock.calls[0][0].payload;
      const allIds = keyPaths.map(
        (kp: (string | number)[]) => kp[kp.length - 1],
      );
      expect(allIds).not.toContain(user3._id);
    });
  });
});
