/* eslint-disable @typescript-eslint/no-explicit-any */
import { RootState } from "@/src/store/store";
import { user1, user2, user3 } from "./mockData";
import { updateEntity } from "@/src/store/generated/productApi";

// import { updateEntity } from "@/src/scripts/content";

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

describe("updateEntity", () => {
  describe("dispatching", () => {
    it("dispatches queryResultsUpdated with the correct action type", async () => {
      const cacheKey = "getUsers({})";
      const { dispatch, getState } = makeMockStore({
        [cacheKey]: { endpointName: "getUsers", data: [user1, user3] },
      });

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "updated";
      })(dispatch, getState);

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "api/queries/entitiesUpdated",
        }),
      );
    });

    it("does not dispatch when the entity is not found", async () => {
      const { dispatch, getState } = makeMockStore({
        "getUsers({})": { endpointName: "getUsers", data: [user3] },
      });

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "updated";
      })(dispatch, getState);

      expect(dispatch).not.toHaveBeenCalled();
    });

    it("dispatches once with results for all cache entries that contain the entity", async () => {
      const key1 = "getUsers({})";
      const key2 = 'getUsersSearch({"q":"alice"})';
      const { dispatch, getState } = makeMockStore({
        [key1]: { endpointName: "getUsers", data: [user1] },
        [key2]: { endpointName: "getUsersSearch", data: [user1] },
      });

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "updated";
      })(dispatch, getState);

      expect(dispatch).toHaveBeenCalledTimes(1);
      const { keyPaths } = dispatch.mock.calls[0][0].payload;
      const cacheKeys = keyPaths.map(([key]: (string | number)[]) => key);
      expect(cacheKeys).toEqual(expect.arrayContaining([key1, key2]));
    });

    it("dispatches once with multiple results when entity appears multiple times in a single entry", async () => {
      // user1 appears at [0] directly and at [1, 'followers', 0] inside user2
      const { dispatch, getState } = makeMockStore({
        "getUsers({})": { endpointName: "getUsers", data: [user1, user2] },
      });

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "updated";
      })(dispatch, getState);

      expect(dispatch).toHaveBeenCalledTimes(1);
      const { keyPaths } = dispatch.mock.calls[0][0].payload;
      expect(keyPaths).toHaveLength(2);
    });
  });

  describe("payload correctness", () => {
    it("results entry includes queryCacheKey, 'data', and keypath to the entity", async () => {
      const cacheKey = "getUsers({})";
      const { dispatch, getState } = makeMockStore({
        [cacheKey]: { endpointName: "getUsers", data: [user1, user3] },
      });

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "updated";
      })(dispatch, getState);

      const { keyPaths } = dispatch.mock.calls[0][0].payload;
      expect(keyPaths).toHaveLength(1);
      expect(keyPaths[0]).toEqual([cacheKey, "data", 0]);
    });

    it("results entry for a nested entity includes the full keypath", async () => {
      // user1 only appears nested inside user2's followers, not at the top level
      const cacheKey = "getUsers({})";
      const { dispatch, getState } = makeMockStore({
        [cacheKey]: {
          endpointName: "getUsers",
          data: [{ ...user2, followers: [{ ...user1 }] }],
        },
      });

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "updated";
      })(dispatch, getState);

      const { keyPaths } = dispatch.mock.calls[0][0].payload;
      expect(keyPaths).toHaveLength(1);
      expect(keyPaths[0]).toEqual([cacheKey, "data", 0, "followers", 0]);
    });

    it("updatedEntity reflects the mutations applied by the updater", async () => {
      const { dispatch, getState } = makeMockStore({
        "getUsers({})": { endpointName: "getUsers", data: [user1] },
      });

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "updated";
      })(dispatch, getState);

      const { updatedEntity } = dispatch.mock.calls[0][0].payload;
      expect(updatedEntity.username).toBe("updated");
    });

    it("updatedEntity preserves unchanged fields", async () => {
      const { dispatch, getState } = makeMockStore({
        "getUsers({})": { endpointName: "getUsers", data: [user1] },
      });

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "updated";
      })(dispatch, getState);

      const { updatedEntity } = dispatch.mock.calls[0][0].payload;
      expect(updatedEntity.email).toBe(user1.email);
    });
  });

  describe("updater function", () => {
    it("receives the current entity value", async () => {
      const received: string[] = [];
      const { dispatch, getState } = makeMockStore({
        "getUsers({})": { endpointName: "getUsers", data: [user1] },
      });

      await updateEntity("User", user1._id, (draft) => {
        received.push(draft.username);
      })(dispatch, getState);

      expect(received).toEqual([user1.username]);
    });

    it("applies multiple field mutations from the updater", async () => {
      const { dispatch, getState } = makeMockStore({
        "getUsers({})": { endpointName: "getUsers", data: [user1] },
      });

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "newname";
        draft.email = "new@example.com";
      })(dispatch, getState);

      const { updatedEntity } = dispatch.mock.calls[0][0].payload;
      expect(updatedEntity.username).toBe("newname");
      expect(updatedEntity.email).toBe("new@example.com");
    });

    it("does not affect unrelated entities in the same array", async () => {
      const { dispatch, getState } = makeMockStore({
        "getUsers({})": { endpointName: "getUsers", data: [user1, user3] },
      });

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "updated";
      })(dispatch, getState);

      // updatedEntity only reflects user1, not user3
      const { updatedEntity } = dispatch.mock.calls[0][0].payload;
      expect(updatedEntity._id).toBe(user1._id);
      expect(updatedEntity.username).not.toBe(user3.username);
    });
  });
});
