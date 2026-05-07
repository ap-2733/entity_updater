/* eslint-disable @typescript-eslint/no-explicit-any */
import { applyPatches, enablePatches } from "immer";
import { updateEntity } from "@/src/store/generated/updateEntity";
import { RootState } from "@/src/store/store";
import { user1, user2, user3 } from "./mockData";

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

describe("updateEntity", () => {
  describe("dispatching", () => {
    it("dispatches queryResultPatched with the correct queryCacheKey", async () => {
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
          type: "api/queries/queryResultPatched",
          payload: expect.objectContaining({ queryCacheKey: cacheKey }),
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

    it("dispatches once per cache entry that contains the entity", async () => {
      const key1 = "getUsers({})";
      const key2 = 'getUsersSearch({"q":"alice"})';
      const { dispatch, getState } = makeMockStore({
        [key1]: { endpointName: "getUsers", data: [user1] },
        [key2]: { endpointName: "getUsersSearch", data: [user1] },
      });

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "updated";
      })(dispatch, getState);

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

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "updated";
      })(dispatch, getState);

      expect(dispatch).toHaveBeenCalledTimes(2);
    });
  });

  describe("patch correctness", () => {
    it("patches produce the updated value when applied to the original data", async () => {
      const data = [{ ...user1 }];
      const cacheKey = "getUsers({})";
      const { dispatch, getState } = makeMockStore({
        [cacheKey]: { endpointName: "getUsers", data },
      });

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "updated";
      })(dispatch, getState);

      const { patches } = dispatch.mock.calls[0][0].payload;
      const result = applyPatches(data, patches) as typeof data;
      expect(result[0].username).toBe("updated");
    });

    it("invertedPatches restore the original value", async () => {
      const data = [{ ...user1 }];
      const cacheKey = "getUsers({})";
      const { dispatch, getState } = makeMockStore({
        [cacheKey]: { endpointName: "getUsers", data },
      });

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "updated";
      })(dispatch, getState);

      const { patches, invertedPatches } = dispatch.mock.calls[0][0].payload;
      const patched = applyPatches(data, patches) as typeof data;
      const restored = applyPatches(patched, invertedPatches) as typeof data;
      expect(restored[0].username).toBe(user1.username);
    });

    it("patches a nested entity found via keypath", async () => {
      // user1 only appears nested inside user2's followers, not at the top level
      const data = [{ ...user2, followers: [{ ...user1 }] }];
      const cacheKey = "getUsers({})";
      const { dispatch, getState } = makeMockStore({
        [cacheKey]: { endpointName: "getUsers", data },
      });

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "updated";
      })(dispatch, getState);

      expect(dispatch).toHaveBeenCalledTimes(1);
      const { patches } = dispatch.mock.calls[0][0].payload;
      const result = applyPatches(data, patches) as typeof data;
      expect(result[0].followers[0].username).toBe("updated");
    });

    it("leaves unrelated entities in the same array unchanged", async () => {
      const data = [{ ...user1 }, { ...user3 }];
      const cacheKey = "getUsers({})";
      const { dispatch, getState } = makeMockStore({
        [cacheKey]: { endpointName: "getUsers", data },
      });

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "updated";
      })(dispatch, getState);

      const { patches } = dispatch.mock.calls[0][0].payload;
      const result = applyPatches(data, patches) as typeof data;
      expect(result[1].username).toBe(user3.username);
    });
  });

  describe("updater function", () => {
    it("receives the current entity value", async () => {
      const data = [{ ...user1 }];
      const received: string[] = [];
      const { dispatch, getState } = makeMockStore({
        "getUsers({})": { endpointName: "getUsers", data },
      });

      await updateEntity("User", user1._id, (draft) => {
        received.push(draft.username);
      })(dispatch, getState);

      expect(received).toEqual([user1.username]);
    });

    it("applies multiple field mutations from the updater", async () => {
      const data = [{ ...user1 }];
      const cacheKey = "getUsers({})";
      const { dispatch, getState } = makeMockStore({
        [cacheKey]: { endpointName: "getUsers", data },
      });

      await updateEntity("User", user1._id, (draft) => {
        draft.username = "newname";
        draft.email = "new@example.com";
      })(dispatch, getState);

      const { patches } = dispatch.mock.calls[0][0].payload;
      const result = applyPatches(data, patches) as typeof data;
      expect(result[0].username).toBe("newname");
      expect(result[0].email).toBe("new@example.com");
    });
  });
});
