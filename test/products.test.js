import { createTestStore } from "./testStore";
import { productApi } from "../src/store/productApi";
import { user1, user2, user3, comment2, reviewThread2, repo1 } from "./mockData";
import { updateEntity } from "../src/store/updateEntity";

test("fetches and updates user", async () => {
  const store = createTestStore();

  await store.dispatch(productApi.endpoints.getUsers.initiate({}));

  await store.dispatch(
    productApi.endpoints.getUsersById.initiate({ id: "user001" }),
  );

  await store.dispatch(
    productApi.endpoints.getUsersSearch.initiate({ q: "alice" }),
  );

  await store.dispatch(
    updateEntity({
      typeName: "User",
      id: "user001",
      update: (draft) => { draft.displayName = "Updated User Name"; },
    }),
  );

  const result = productApi.endpoints.getUsers.select({})(store.getState());
  expect(result.data?.[0].displayName).toBe("Updated User Name");

  const result2 = productApi.endpoints.getUsersById.select({
    id: "user001",
  })(store.getState());
  expect(result2.data.user.displayName).toBe("Updated User Name");

  const result3 = productApi.endpoints.getUsersSearch.select({
    q: "alice",
  })(store.getState());
  expect(result3.data[0].displayName).toBe("Updated User Name");
});

test("updateEntity produces no side effects when update makes no changes", async () => {
  const store = createTestStore();
  await store.dispatch(productApi.endpoints.getUsers.initiate({}));

  store.dispatch(
    updateEntity({
      typeName: "User",
      id: user1._id,
      update: (draft) => { draft.displayName = user1.displayName; },
    }),
  );

  const result = productApi.endpoints.getUsers.select({})(store.getState());
  expect(result.data[0].displayName).toBe(user1.displayName);
  expect(result.data[1].displayName).toBe(user2.displayName);
  expect(result.data[2].displayName).toBe(user3.displayName);
});

test("updateEntity updates a Comment entity in getIssuesById cache", async () => {
  const store = createTestStore();

  await store.dispatch(
    productApi.endpoints.getIssuesById.initiate({ id: "issue001" }),
  );

  await store.dispatch(
    updateEntity({
      typeName: "Comment",
      id: "comment001",
      update: (draft) => { draft.body = "Updated comment!"; },
    }),
  );

  const result = productApi.endpoints.getIssuesById.select({
    id: "issue001",
  })(store.getState());
  expect(result.data.comments[0].body).toBe("Updated comment!");
  expect(result.data.comments[1].body).toBe(comment2.body);
});

test("updateEntity updates a ReviewThread entity in getPullRequestsByIdReviews cache", async () => {
  const store = createTestStore();

  await store.dispatch(productApi.endpoints.getPullRequestsByIdReviews.initiate({ id: "pr001" }));

  await store.dispatch(
    updateEntity({
      typeName: "ReviewThread",
      id: "rt001",
      update: (draft) => { draft.isResolved = true; },
    }),
  );

  const result = productApi.endpoints.getPullRequestsByIdReviews.select({ id: "pr001" })(store.getState());
  expect(result.data[0].isResolved).toBe(true);
  expect(result.data[1].isResolved).toBe(reviewThread2.isResolved);
});

test("updateEntity patches entity at parentFork path in getRepositoriesById", async () => {
  const store = createTestStore();

  // repo2 has parentFork: repo1
  await store.dispatch(
    productApi.endpoints.getRepositoriesById.initiate({ id: "repo002" }),
  );

  await store.dispatch(
    updateEntity({
      typeName: "Repository",
      id: repo1._id,
      update: (draft) => { draft.name = "Updated Nested Repo"; },
    }),
  );

  const result = productApi.endpoints.getRepositoriesById.select({
    id: "repo002",
  })(store.getState());
  expect(result.data.repository.parentFork.name).toBe("Updated Nested Repo");
});

test("updateEntity patches entity at both direct and followers positions in getUsers", async () => {
  const store = createTestStore();

  // user2.followers = [user1], so user1 appears at [0] and [1, "followers", 0]
  await store.dispatch(
    productApi.util.upsertQueryData("getUsers", {}, [user1, user2]),
  );

  await store.dispatch(
    updateEntity({
      typeName: "User",
      id: user1._id,
      update: (draft) => { draft.displayName = "Updated At All Positions"; },
    }),
  );

  const result = productApi.endpoints.getUsers.select({})(store.getState());
  expect(result.data[0].displayName).toBe("Updated At All Positions");
  expect(result.data[1].followers[0].displayName).toBe("Updated At All Positions");
});