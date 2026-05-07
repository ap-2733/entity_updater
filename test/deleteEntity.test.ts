/* eslint-disable @typescript-eslint/no-explicit-any */
import { applyPatches, enablePatches } from "immer";
import { deleteEntity } from "../src/store/generated/deleteEntity";
import { RootState } from "../src/store/store";
import { user1, user2, user3, repo1, repo2 } from "./mockData";

enablePatches();

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
    it("dispatches queryResultPatched with the correct queryCacheKey", async () => {
      const cacheKey = "getUsers({})";
      const { dispatch, getState } = makeMockStore({
        [cacheKey]: { endpointName: "getUsers", data: [user1, user3] },
      });

      await deleteEntity("User", user1._id)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "api/queries/queryResultPatched",
          payload: expect.objectContaining({ queryCacheKey: cacheKey }),
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

    it("dispatches once per cache entry that contains the entity", async () => {
      const key1 = "getUsers({})";
      const key2 = 'getUsersSearch({"q":"alice"})';
      const { dispatch, getState } = makeMockStore({
        [key1]: { endpointName: "getUsers", data: [user1] },
        [key2]: { endpointName: "getUsersSearch", data: [user1] },
      });

      await deleteEntity("User", user1._id)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledTimes(2);
      const cacheKeys = dispatch.mock.calls.map(
        ([action]: [any]) => action.payload.queryCacheKey,
      );
      expect(cacheKeys).toEqual(expect.arrayContaining([key1, key2]));
    });

    it("dispatches for each location when entity appears multiple times in a single entry", async () => {
      // user1 appears at [0] directly and at [1, 'followers', 0] inside user2
      const { dispatch, getState } = makeMockStore({
        "getUsers({})": { endpointName: "getUsers", data: [user1, user2] },
      });

      await deleteEntity("User", user1._id)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledTimes(2);
    });
  });

  describe("patch correctness", () => {
    it("patches splice the entity out of an array", async () => {
      const data = [{ ...user1 }, { ...user3 }];
      const { dispatch, getState } = makeMockStore({
        "getUsers({})": { endpointName: "getUsers", data },
      });

      await deleteEntity("User", user1._id)(dispatch, getState);

      const { patches } = dispatch.mock.calls[0][0].payload;
      const result = applyPatches(data, patches) as typeof data;
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe(user3._id);
    });

    it("invertedPatches restore the original array after splicing", async () => {
      const data = [{ ...user1 }, { ...user3 }];
      const { dispatch, getState } = makeMockStore({
        "getUsers({})": { endpointName: "getUsers", data },
      });

      await deleteEntity("User", user1._id)(dispatch, getState);

      const { patches, invertedPatches } = dispatch.mock.calls[0][0].payload;
      const patched = applyPatches(data, patches) as typeof data;
      const restored = applyPatches(patched, invertedPatches) as typeof data;
      expect(restored).toHaveLength(2);
      expect(restored[0]._id).toBe(user1._id);
    });

    it("patches nullify a property reference", async () => {
      const data = {
        repository: { ...repo2, parentFork: { ...repo1 } },
        collaborators: [],
        forks: [],
      };
      const { dispatch, getState } = makeMockStore({
        'getRepositoriesById({"id":"r2"})': {
          endpointName: "getRepositoriesById",
          data,
        },
      });

      await deleteEntity("Repository", repo1._id)(dispatch, getState);

      const { patches } = dispatch.mock.calls[0][0].payload;
      const result = applyPatches(data, patches) as typeof data;
      expect(result.repository.parentFork).toBeNull();
    });

    it("invertedPatches restore a nullified property reference", async () => {
      const data = {
        repository: { ...repo2, parentFork: { ...repo1 } },
        collaborators: [],
        forks: [],
      };
      const { dispatch, getState } = makeMockStore({
        'getRepositoriesById({"id":"r2"})': {
          endpointName: "getRepositoriesById",
          data,
        },
      });

      await deleteEntity("Repository", repo1._id)(dispatch, getState);

      const { patches, invertedPatches } = dispatch.mock.calls[0][0].payload;
      const patched = applyPatches(data, patches) as typeof data;
      const restored = applyPatches(patched, invertedPatches) as typeof data;
      expect(restored.repository.parentFork?._id).toBe(repo1._id);
    });

    it("removes a nested entity found via keypath", async () => {
      // user1 only appears nested inside user2's followers, not at the top level
      const data = [{ ...user2, followers: [{ ...user1 }] }];
      const { dispatch, getState } = makeMockStore({
        "getUsers({})": { endpointName: "getUsers", data },
      });

      await deleteEntity("User", user1._id)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledTimes(1);
      const { patches } = dispatch.mock.calls[0][0].payload;
      const result = applyPatches(data, patches) as typeof data;
      expect(result[0].followers).toHaveLength(0);
    });

    it("leaves unrelated entities in the same array unchanged", async () => {
      const data = [{ ...user1 }, { ...user3 }];
      const { dispatch, getState } = makeMockStore({
        "getUsers({})": { endpointName: "getUsers", data },
      });

      await deleteEntity("User", user1._id)(dispatch, getState);

      const { patches } = dispatch.mock.calls[0][0].payload;
      const result = applyPatches(data, patches) as typeof data;
      expect(result.some((u) => u._id === user3._id)).toBe(true);
    });
  });
});
