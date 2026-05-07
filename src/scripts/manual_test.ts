/* eslint-disable @typescript-eslint/no-explicit-any */
import { productApi } from "@/src/store/productApi";
import { store } from "@/src/store/store";
import { findEntity } from "@/src/scripts/utils/findEntity";
import { enablePatches } from "immer";
import { updateEntity } from "@/src/scripts/utils/updateEntity";
import { get } from "@/src/scripts/utils/utils";

enablePatches();

function drain(gen: Generator<void>): void {
  while (!gen.next().done) {}
}

async function test() {
  await store.dispatch(productApi.endpoints.getUsers.initiate({}));
  await store.dispatch(productApi.endpoints.getRepositories.initiate({}));
  await store.dispatch(productApi.endpoints.getIssues.initiate({}));
  await store.dispatch(productApi.endpoints.getPullRequests.initiate({}));
  await store.dispatch(productApi.endpoints.getTeams.initiate());

  const start = Date.now();
  await store.dispatch(
    updateEntity("User", "user-0271", (draft) => {
      draft.username = "updated";
    }),
  );
  console.log(Date.now() - start);
  drain(
    findEntity(
      "User",
      "user-0271",
      store.getState().api.queries as any,
      (queryKey, keypath) => {
        const data = (store.getState().api.queries as any)[queryKey]["data"];
        const entity = get(data, keypath);
        console.log(entity);
      },
      100,
    ),
  );
}

test();
