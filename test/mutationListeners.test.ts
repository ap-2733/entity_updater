/* eslint-disable @typescript-eslint/no-explicit-any */
import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { productApi } from "../src/store/productApi";
import { user1, user3, repo1, issue1, pr1 } from "./mockData";
import { wrapApiReducer } from "@/src/scripts/utils";
import { setupMutationListeners } from "@/src/store/generated/productApi";

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

// Omits productApi.middleware to avoid fetch requests in tests; the reducer
// and listener middleware are sufficient to verify cache updates.
function makeStore(
  queries: Record<string, { endpointName: string; data: unknown }> = {},
) {
  const listenerMiddleware = createListenerMiddleware();
  setupMutationListeners(listenerMiddleware, productApi);
  return configureStore({
    reducer: { api: wrapApiReducer(productApi.reducer) } as any,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat(
        listenerMiddleware.middleware,
      ),
    preloadedState: {
      api: {
        queries: Object.fromEntries(
          Object.entries(queries).map(([key, { endpointName, data }]) => [
            key,
            {
              status: "fulfilled",
              endpointName,
              requestId: "test",
              originalArgs: {},
              data,
              startedTimeStamp: 1000,
              fulfilledTimeStamp: 1001,
            },
          ]),
        ),
        mutations: {},
        provided: {},
        subscriptions: {},
        config: {
          online: true,
          focused: true,
          middlewareRegistered: false,
          refetchOnFocus: false,
          refetchOnReconnect: false,
          refetchOnMountOrArgChange: false,
          keepUnusedDataFor: 60,
          reducerPath: productApi.reducerPath,
        },
      },
    } as any,
  });
}

// Flush enough microtask rounds for the full listener→updateEntity→requestIdleCallback
// chain to complete. jest.useFakeTimers() (set globally in setupTests.ts) replaces
// setTimeout so we must use Promise.resolve() rounds instead.
async function flushMicrotasks() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

async function dispatchMutationFulfilled(
  store: ReturnType<typeof makeStore>,
  endpointName: string,
  payload: unknown,
) {
  store.dispatch({
    type: `${productApi.reducerPath}/executeMutation/fulfilled`,
    payload,
    meta: {
      requestId: "test",
      requestStatus: "fulfilled",
      arg: { endpointName, type: "mutation", originalArgs: {} },
    },
  });
  await flushMicrotasks();
}

function getQueries(store: ReturnType<typeof makeStore>) {
  return (store.getState() as any).api.queries as Record<
    string,
    { endpointName: string; data: unknown } | undefined
  >;
}

function findQueryData<T>(
  store: ReturnType<typeof makeStore>,
  endpointName: string,
): T {
  const entry = Object.values(getQueries(store)).find(
    (q) => q?.endpointName === endpointName,
  );
  return entry?.data as T;
}

describe("mutationListeners", () => {
  describe("patchUsersById", () => {
    it("updates the user in a flat list cache entry", async () => {
      const store = makeStore({
        "getUsers({})": { endpointName: "getUsers", data: [{ ...user1 }] },
      });

      await dispatchMutationFulfilled(store, "patchUsersById", {
        ...user1,
        username: "alice-updated",
      });

      const data = findQueryData<(typeof user1)[]>(store, "getUsers");
      expect(data[0].username).toBe("alice-updated");
    });

    it("does not affect other users in the same cache entry", async () => {
      const store = makeStore({
        "getUsers({})": {
          endpointName: "getUsers",
          data: [{ ...user1 }, { ...user3 }],
        },
      });

      await dispatchMutationFulfilled(store, "patchUsersById", {
        ...user1,
        username: "alice-updated",
      });

      const data = findQueryData<(typeof user1)[]>(store, "getUsers");
      expect(data.find((u) => u._id === user3._id)?.username).toBe(
        user3.username,
      );
    });

    it("updates the user across multiple cache entries", async () => {
      const store = makeStore({
        "getUsers({})": { endpointName: "getUsers", data: [{ ...user1 }] },
        'getUsersSearch({"q":"alice"})': {
          endpointName: "getUsersSearch",
          data: [{ ...user1 }],
        },
      });

      await dispatchMutationFulfilled(store, "patchUsersById", {
        ...user1,
        username: "alice-updated",
      });

      const listData = findQueryData<(typeof user1)[]>(store, "getUsers");
      const searchData = findQueryData<(typeof user1)[]>(
        store,
        "getUsersSearch",
      );
      expect(listData[0].username).toBe("alice-updated");
      expect(searchData[0].username).toBe("alice-updated");
    });

    it("does not throw when the entity is not in cache", async () => {
      const store = makeStore();
      await expect(
        dispatchMutationFulfilled(store, "patchUsersById", {
          ...user1,
          username: "alice-updated",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("patchRepositoriesById", () => {
    it("updates the repository in cache", async () => {
      const store = makeStore({
        "getRepositories({})": {
          endpointName: "getRepositories",
          data: [{ ...repo1 }],
        },
      });

      await dispatchMutationFulfilled(store, "patchRepositoriesById", {
        ...repo1,
        name: "renamed-project",
      });

      const data = findQueryData<(typeof repo1)[]>(store, "getRepositories");
      expect(data[0].name).toBe("renamed-project");
    });
  });

  describe("putIssuesById", () => {
    it("replaces the issue in cache", async () => {
      const store = makeStore({
        "getIssues({})": { endpointName: "getIssues", data: [{ ...issue1 }] },
      });

      await dispatchMutationFulfilled(store, "putIssuesById", {
        ...issue1,
        title: "Fixed login bug",
        state: "closed",
      });

      const data = findQueryData<(typeof issue1)[]>(store, "getIssues");
      expect(data[0].title).toBe("Fixed login bug");
      expect(data[0].state).toBe("closed");
    });
  });

  describe("patchIssuesById", () => {
    it("updates the issue in cache", async () => {
      const store = makeStore({
        "getIssues({})": { endpointName: "getIssues", data: [{ ...issue1 }] },
      });

      await dispatchMutationFulfilled(store, "patchIssuesById", {
        ...issue1,
        state: "closed",
      });

      const data = findQueryData<(typeof issue1)[]>(store, "getIssues");
      expect(data[0].state).toBe("closed");
    });
  });

  describe("putPullRequestsById", () => {
    it("replaces the pull request in cache", async () => {
      const store = makeStore({
        "getPullRequests({})": {
          endpointName: "getPullRequests",
          data: [{ ...pr1 }],
        },
      });

      await dispatchMutationFulfilled(store, "putPullRequestsById", {
        ...pr1,
        title: "Updated PR",
        state: "merged",
      });

      const data = findQueryData<(typeof pr1)[]>(store, "getPullRequests");
      expect(data[0].title).toBe("Updated PR");
      expect(data[0].state).toBe("merged");
    });
  });

  describe("patchPullRequestsById", () => {
    it("updates the pull request in cache", async () => {
      const store = makeStore({
        "getPullRequests({})": {
          endpointName: "getPullRequests",
          data: [{ ...pr1 }],
        },
      });

      await dispatchMutationFulfilled(store, "patchPullRequestsById", {
        ...pr1,
        state: "merged",
      });

      const data = findQueryData<(typeof pr1)[]>(store, "getPullRequests");
      expect(data[0].state).toBe("merged");
    });
  });
});
