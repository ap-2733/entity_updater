/* eslint-disable @typescript-eslint/no-explicit-any */
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { productApi } from "./productApi";
import { entityLoaded, entityRemoved } from "./entityActions";

export const entityListenerMiddleware = createListenerMiddleware();

function walkGetUsers(
  data: any,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({ entityType: "User", item: data[i0], keyPath: [...[], i0] });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getUsers.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetUsers(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getUsers",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getUsers",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getUsers",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getUsers") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetUsers(
      data,
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getUsers") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetUsers(
        oldData,
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      );
    }
    if (newData) {
      walkGetUsers(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetUsersSearch(
  data: any,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({ entityType: "User", item: data[i0], keyPath: [...[], i0] });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getUsersSearch.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetUsersSearch(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getUsersSearch",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getUsersSearch",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getUsersSearch",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getUsersSearch") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetUsersSearch(
      data,
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getUsersSearch") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetUsersSearch(
        oldData,
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      );
    }
    if (newData) {
      walkGetUsersSearch(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetUsersById(
  data: any,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
  > = [];
  if (data.user != null) {
    stack.push({
      entityType: "User",
      item: data.user,
      keyPath: [...[], "user"],
    });
  }
  if (data.followers != null) {
    for (let i0 = 0; i0 < data.followers.length; i0++) {
      stack.push({
        entityType: "User",
        item: data.followers[i0],
        keyPath: [...[...[], "followers"], i0],
      });
    }
  }
  if (data.following != null) {
    for (let i0 = 0; i0 < data.following.length; i0++) {
      stack.push({
        entityType: "User",
        item: data.following[i0],
        keyPath: [...[...[], "following"], i0],
      });
    }
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getUsersById.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetUsersById(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getUsersById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getUsersById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getUsersById",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getUsersById") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetUsersById(
      data,
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getUsersById") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetUsersById(
        oldData,
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      );
    }
    if (newData) {
      walkGetUsersById(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetUsersByIdRepositories(
  data: any,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({
      entityType: "Repository",
      item: data[i0],
      keyPath: [...[], i0],
    });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getUsersByIdRepositories.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetUsersByIdRepositories(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdRepositories",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdRepositories",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdRepositories",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getUsersByIdRepositories") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetUsersByIdRepositories(
      data,
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getUsersByIdRepositories") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetUsersByIdRepositories(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      );
    }
    if (newData) {
      walkGetUsersByIdRepositories(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetUsersByIdTeams(
  data: any,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({ entityType: "Team", item: data[i0], keyPath: [...[], i0] });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getUsersByIdTeams.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetUsersByIdTeams(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdTeams",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdTeams",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdTeams",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getUsersByIdTeams") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetUsersByIdTeams(
      data,
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getUsersByIdTeams") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetUsersByIdTeams(
        oldData,
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
      );
    }
    if (newData) {
      walkGetUsersByIdTeams(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetUsersByIdIssues(
  data: any,
  onIssue: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
  onComment: (item: any, keyPath: (string | number)[]) => void,
  onPullRequest: (item: any, keyPath: (string | number)[]) => void,
  onCommit: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "Issue"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
    | { entityType: "Comment"; item: any; keyPath: (string | number)[] }
    | { entityType: "PullRequest"; item: any; keyPath: (string | number)[] }
    | { entityType: "Commit"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({ entityType: "Issue", item: data[i0], keyPath: [...[], i0] });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "Issue") {
      const { item, keyPath } = entry;
      onIssue(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.assignees != null) {
        for (let i0 = 0; i0 < item.assignees.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.assignees[i0],
            keyPath: [...[...keyPath, "assignees"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.linkedPullRequests != null) {
        for (let i0 = 0; i0 < item.linkedPullRequests.length; i0++) {
          stack.push({
            entityType: "PullRequest",
            item: item.linkedPullRequests[i0],
            keyPath: [...[...keyPath, "linkedPullRequests"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    } else if (entry.entityType === "Comment") {
      const { item, keyPath } = entry;
      onComment(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.replies != null) {
        for (let i0 = 0; i0 < item.replies.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.replies[i0],
            keyPath: [...[...keyPath, "replies"], i0],
          });
        }
      }
      if (item.parentComment != null) {
        stack.push({
          entityType: "Comment",
          item: item.parentComment,
          keyPath: [...keyPath, "parentComment"],
        });
      }
    } else if (entry.entityType === "PullRequest") {
      const { item, keyPath } = entry;
      onPullRequest(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.reviewers != null) {
        for (let i0 = 0; i0 < item.reviewers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.reviewers[i0],
            keyPath: [...[...keyPath, "reviewers"], i0],
          });
        }
      }
      if (item.commits != null) {
        for (let i0 = 0; i0 < item.commits.length; i0++) {
          stack.push({
            entityType: "Commit",
            item: item.commits[i0],
            keyPath: [...[...keyPath, "commits"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.resolvedIssues != null) {
        for (let i0 = 0; i0 < item.resolvedIssues.length; i0++) {
          stack.push({
            entityType: "Issue",
            item: item.resolvedIssues[i0],
            keyPath: [...[...keyPath, "resolvedIssues"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "Commit") {
      const { item, keyPath } = entry;
      onCommit(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.coAuthors != null) {
        for (let i0 = 0; i0 < item.coAuthors.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.coAuthors[i0],
            keyPath: [...[...keyPath, "coAuthors"], i0],
          });
        }
      }
      if (item.pullRequest != null) {
        stack.push({
          entityType: "PullRequest",
          item: item.pullRequest,
          keyPath: [...keyPath, "pullRequest"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getUsersByIdIssues.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetUsersByIdIssues(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "Issue",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Comment",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "PullRequest",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Commit",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdIssues",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getUsersByIdIssues") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetUsersByIdIssues(
      data,
      (item) =>
        batch.push({ entityType: "Issue", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Comment", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "PullRequest", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Commit", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getUsersByIdIssues") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetUsersByIdIssues(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "Issue",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Comment",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "PullRequest",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Commit",
            id: item._id,
            queryCacheKey,
          }),
      );
    }
    if (newData) {
      walkGetUsersByIdIssues(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Issue",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Comment",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "PullRequest",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Commit",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetUsersByIdPullRequests(
  data: any,
  onPullRequest: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
  onCommit: (item: any, keyPath: (string | number)[]) => void,
  onComment: (item: any, keyPath: (string | number)[]) => void,
  onIssue: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "PullRequest"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
    | { entityType: "Commit"; item: any; keyPath: (string | number)[] }
    | { entityType: "Comment"; item: any; keyPath: (string | number)[] }
    | { entityType: "Issue"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({
      entityType: "PullRequest",
      item: data[i0],
      keyPath: [...[], i0],
    });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "PullRequest") {
      const { item, keyPath } = entry;
      onPullRequest(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.reviewers != null) {
        for (let i0 = 0; i0 < item.reviewers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.reviewers[i0],
            keyPath: [...[...keyPath, "reviewers"], i0],
          });
        }
      }
      if (item.commits != null) {
        for (let i0 = 0; i0 < item.commits.length; i0++) {
          stack.push({
            entityType: "Commit",
            item: item.commits[i0],
            keyPath: [...[...keyPath, "commits"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.resolvedIssues != null) {
        for (let i0 = 0; i0 < item.resolvedIssues.length; i0++) {
          stack.push({
            entityType: "Issue",
            item: item.resolvedIssues[i0],
            keyPath: [...[...keyPath, "resolvedIssues"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    } else if (entry.entityType === "Commit") {
      const { item, keyPath } = entry;
      onCommit(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.coAuthors != null) {
        for (let i0 = 0; i0 < item.coAuthors.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.coAuthors[i0],
            keyPath: [...[...keyPath, "coAuthors"], i0],
          });
        }
      }
      if (item.pullRequest != null) {
        stack.push({
          entityType: "PullRequest",
          item: item.pullRequest,
          keyPath: [...keyPath, "pullRequest"],
        });
      }
    } else if (entry.entityType === "Comment") {
      const { item, keyPath } = entry;
      onComment(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.replies != null) {
        for (let i0 = 0; i0 < item.replies.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.replies[i0],
            keyPath: [...[...keyPath, "replies"], i0],
          });
        }
      }
      if (item.parentComment != null) {
        stack.push({
          entityType: "Comment",
          item: item.parentComment,
          keyPath: [...keyPath, "parentComment"],
        });
      }
    } else if (entry.entityType === "Issue") {
      const { item, keyPath } = entry;
      onIssue(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.assignees != null) {
        for (let i0 = 0; i0 < item.assignees.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.assignees[i0],
            keyPath: [...[...keyPath, "assignees"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.linkedPullRequests != null) {
        for (let i0 = 0; i0 < item.linkedPullRequests.length; i0++) {
          stack.push({
            entityType: "PullRequest",
            item: item.linkedPullRequests[i0],
            keyPath: [...[...keyPath, "linkedPullRequests"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getUsersByIdPullRequests.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetUsersByIdPullRequests(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "PullRequest",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Commit",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Comment",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Issue",
          id: item._id,
          keyPath,
          queryName: "getUsersByIdPullRequests",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getUsersByIdPullRequests") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetUsersByIdPullRequests(
      data,
      (item) =>
        batch.push({ entityType: "PullRequest", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Commit", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Comment", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Issue", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getUsersByIdPullRequests") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetUsersByIdPullRequests(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "PullRequest",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Commit",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Comment",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Issue",
            id: item._id,
            queryCacheKey,
          }),
      );
    }
    if (newData) {
      walkGetUsersByIdPullRequests(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "PullRequest",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Commit",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Comment",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Issue",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetRepositories(
  data: any,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({
      entityType: "Repository",
      item: data[i0],
      keyPath: [...[], i0],
    });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getRepositories.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetRepositories(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getRepositories",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getRepositories",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getRepositories",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getRepositories") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetRepositories(
      data,
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getRepositories") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetRepositories(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      );
    }
    if (newData) {
      walkGetRepositories(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetRepositoriesSearch(
  data: any,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({
      entityType: "Repository",
      item: data[i0],
      keyPath: [...[], i0],
    });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getRepositoriesSearch.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetRepositoriesSearch(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesSearch",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesSearch",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesSearch",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getRepositoriesSearch") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetRepositoriesSearch(
      data,
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getRepositoriesSearch") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetRepositoriesSearch(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      );
    }
    if (newData) {
      walkGetRepositoriesSearch(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetRepositoriesById(
  data: any,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
  > = [];
  if (data.repository != null) {
    stack.push({
      entityType: "Repository",
      item: data.repository,
      keyPath: [...[], "repository"],
    });
  }
  if (data.collaborators != null) {
    for (let i0 = 0; i0 < data.collaborators.length; i0++) {
      stack.push({
        entityType: "User",
        item: data.collaborators[i0],
        keyPath: [...[...[], "collaborators"], i0],
      });
    }
  }
  if (data.forks != null) {
    for (let i0 = 0; i0 < data.forks.length; i0++) {
      stack.push({
        entityType: "Repository",
        item: data.forks[i0],
        keyPath: [...[...[], "forks"], i0],
      });
    }
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getRepositoriesById.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetRepositoriesById(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesById",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getRepositoriesById") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetRepositoriesById(
      data,
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getRepositoriesById") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetRepositoriesById(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      );
    }
    if (newData) {
      walkGetRepositoriesById(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetRepositoriesByIdStargazers(
  data: any,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({ entityType: "User", item: data[i0], keyPath: [...[], i0] });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getRepositoriesByIdStargazers.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetRepositoriesByIdStargazers(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdStargazers",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdStargazers",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdStargazers",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getRepositoriesByIdStargazers") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetRepositoriesByIdStargazers(
      data,
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getRepositoriesByIdStargazers") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetRepositoriesByIdStargazers(
        oldData,
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      );
    }
    if (newData) {
      walkGetRepositoriesByIdStargazers(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetRepositoriesByIdIssues(
  data: any,
  onIssue: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
  onComment: (item: any, keyPath: (string | number)[]) => void,
  onPullRequest: (item: any, keyPath: (string | number)[]) => void,
  onCommit: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "Issue"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
    | { entityType: "Comment"; item: any; keyPath: (string | number)[] }
    | { entityType: "PullRequest"; item: any; keyPath: (string | number)[] }
    | { entityType: "Commit"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({ entityType: "Issue", item: data[i0], keyPath: [...[], i0] });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "Issue") {
      const { item, keyPath } = entry;
      onIssue(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.assignees != null) {
        for (let i0 = 0; i0 < item.assignees.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.assignees[i0],
            keyPath: [...[...keyPath, "assignees"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.linkedPullRequests != null) {
        for (let i0 = 0; i0 < item.linkedPullRequests.length; i0++) {
          stack.push({
            entityType: "PullRequest",
            item: item.linkedPullRequests[i0],
            keyPath: [...[...keyPath, "linkedPullRequests"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    } else if (entry.entityType === "Comment") {
      const { item, keyPath } = entry;
      onComment(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.replies != null) {
        for (let i0 = 0; i0 < item.replies.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.replies[i0],
            keyPath: [...[...keyPath, "replies"], i0],
          });
        }
      }
      if (item.parentComment != null) {
        stack.push({
          entityType: "Comment",
          item: item.parentComment,
          keyPath: [...keyPath, "parentComment"],
        });
      }
    } else if (entry.entityType === "PullRequest") {
      const { item, keyPath } = entry;
      onPullRequest(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.reviewers != null) {
        for (let i0 = 0; i0 < item.reviewers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.reviewers[i0],
            keyPath: [...[...keyPath, "reviewers"], i0],
          });
        }
      }
      if (item.commits != null) {
        for (let i0 = 0; i0 < item.commits.length; i0++) {
          stack.push({
            entityType: "Commit",
            item: item.commits[i0],
            keyPath: [...[...keyPath, "commits"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.resolvedIssues != null) {
        for (let i0 = 0; i0 < item.resolvedIssues.length; i0++) {
          stack.push({
            entityType: "Issue",
            item: item.resolvedIssues[i0],
            keyPath: [...[...keyPath, "resolvedIssues"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "Commit") {
      const { item, keyPath } = entry;
      onCommit(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.coAuthors != null) {
        for (let i0 = 0; i0 < item.coAuthors.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.coAuthors[i0],
            keyPath: [...[...keyPath, "coAuthors"], i0],
          });
        }
      }
      if (item.pullRequest != null) {
        stack.push({
          entityType: "PullRequest",
          item: item.pullRequest,
          keyPath: [...keyPath, "pullRequest"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getRepositoriesByIdIssues.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetRepositoriesByIdIssues(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "Issue",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Comment",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "PullRequest",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Commit",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdIssues",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getRepositoriesByIdIssues") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetRepositoriesByIdIssues(
      data,
      (item) =>
        batch.push({ entityType: "Issue", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Comment", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "PullRequest", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Commit", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getRepositoriesByIdIssues") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetRepositoriesByIdIssues(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "Issue",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Comment",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "PullRequest",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Commit",
            id: item._id,
            queryCacheKey,
          }),
      );
    }
    if (newData) {
      walkGetRepositoriesByIdIssues(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Issue",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Comment",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "PullRequest",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Commit",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetRepositoriesByIdPullRequests(
  data: any,
  onPullRequest: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
  onCommit: (item: any, keyPath: (string | number)[]) => void,
  onComment: (item: any, keyPath: (string | number)[]) => void,
  onIssue: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "PullRequest"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
    | { entityType: "Commit"; item: any; keyPath: (string | number)[] }
    | { entityType: "Comment"; item: any; keyPath: (string | number)[] }
    | { entityType: "Issue"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({
      entityType: "PullRequest",
      item: data[i0],
      keyPath: [...[], i0],
    });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "PullRequest") {
      const { item, keyPath } = entry;
      onPullRequest(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.reviewers != null) {
        for (let i0 = 0; i0 < item.reviewers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.reviewers[i0],
            keyPath: [...[...keyPath, "reviewers"], i0],
          });
        }
      }
      if (item.commits != null) {
        for (let i0 = 0; i0 < item.commits.length; i0++) {
          stack.push({
            entityType: "Commit",
            item: item.commits[i0],
            keyPath: [...[...keyPath, "commits"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.resolvedIssues != null) {
        for (let i0 = 0; i0 < item.resolvedIssues.length; i0++) {
          stack.push({
            entityType: "Issue",
            item: item.resolvedIssues[i0],
            keyPath: [...[...keyPath, "resolvedIssues"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    } else if (entry.entityType === "Commit") {
      const { item, keyPath } = entry;
      onCommit(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.coAuthors != null) {
        for (let i0 = 0; i0 < item.coAuthors.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.coAuthors[i0],
            keyPath: [...[...keyPath, "coAuthors"], i0],
          });
        }
      }
      if (item.pullRequest != null) {
        stack.push({
          entityType: "PullRequest",
          item: item.pullRequest,
          keyPath: [...keyPath, "pullRequest"],
        });
      }
    } else if (entry.entityType === "Comment") {
      const { item, keyPath } = entry;
      onComment(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.replies != null) {
        for (let i0 = 0; i0 < item.replies.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.replies[i0],
            keyPath: [...[...keyPath, "replies"], i0],
          });
        }
      }
      if (item.parentComment != null) {
        stack.push({
          entityType: "Comment",
          item: item.parentComment,
          keyPath: [...keyPath, "parentComment"],
        });
      }
    } else if (entry.entityType === "Issue") {
      const { item, keyPath } = entry;
      onIssue(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.assignees != null) {
        for (let i0 = 0; i0 < item.assignees.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.assignees[i0],
            keyPath: [...[...keyPath, "assignees"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.linkedPullRequests != null) {
        for (let i0 = 0; i0 < item.linkedPullRequests.length; i0++) {
          stack.push({
            entityType: "PullRequest",
            item: item.linkedPullRequests[i0],
            keyPath: [...[...keyPath, "linkedPullRequests"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getRepositoriesByIdPullRequests.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetRepositoriesByIdPullRequests(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "PullRequest",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Commit",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Comment",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Issue",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdPullRequests",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getRepositoriesByIdPullRequests") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetRepositoriesByIdPullRequests(
      data,
      (item) =>
        batch.push({ entityType: "PullRequest", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Commit", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Comment", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Issue", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getRepositoriesByIdPullRequests") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetRepositoriesByIdPullRequests(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "PullRequest",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Commit",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Comment",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Issue",
            id: item._id,
            queryCacheKey,
          }),
      );
    }
    if (newData) {
      walkGetRepositoriesByIdPullRequests(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "PullRequest",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Commit",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Comment",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Issue",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetRepositoriesByIdCommits(
  data: any,
  onCommit: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
  onPullRequest: (item: any, keyPath: (string | number)[]) => void,
  onComment: (item: any, keyPath: (string | number)[]) => void,
  onIssue: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "Commit"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
    | { entityType: "PullRequest"; item: any; keyPath: (string | number)[] }
    | { entityType: "Comment"; item: any; keyPath: (string | number)[] }
    | { entityType: "Issue"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({ entityType: "Commit", item: data[i0], keyPath: [...[], i0] });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "Commit") {
      const { item, keyPath } = entry;
      onCommit(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.coAuthors != null) {
        for (let i0 = 0; i0 < item.coAuthors.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.coAuthors[i0],
            keyPath: [...[...keyPath, "coAuthors"], i0],
          });
        }
      }
      if (item.pullRequest != null) {
        stack.push({
          entityType: "PullRequest",
          item: item.pullRequest,
          keyPath: [...keyPath, "pullRequest"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    } else if (entry.entityType === "PullRequest") {
      const { item, keyPath } = entry;
      onPullRequest(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.reviewers != null) {
        for (let i0 = 0; i0 < item.reviewers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.reviewers[i0],
            keyPath: [...[...keyPath, "reviewers"], i0],
          });
        }
      }
      if (item.commits != null) {
        for (let i0 = 0; i0 < item.commits.length; i0++) {
          stack.push({
            entityType: "Commit",
            item: item.commits[i0],
            keyPath: [...[...keyPath, "commits"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.resolvedIssues != null) {
        for (let i0 = 0; i0 < item.resolvedIssues.length; i0++) {
          stack.push({
            entityType: "Issue",
            item: item.resolvedIssues[i0],
            keyPath: [...[...keyPath, "resolvedIssues"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "Comment") {
      const { item, keyPath } = entry;
      onComment(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.replies != null) {
        for (let i0 = 0; i0 < item.replies.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.replies[i0],
            keyPath: [...[...keyPath, "replies"], i0],
          });
        }
      }
      if (item.parentComment != null) {
        stack.push({
          entityType: "Comment",
          item: item.parentComment,
          keyPath: [...keyPath, "parentComment"],
        });
      }
    } else if (entry.entityType === "Issue") {
      const { item, keyPath } = entry;
      onIssue(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.assignees != null) {
        for (let i0 = 0; i0 < item.assignees.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.assignees[i0],
            keyPath: [...[...keyPath, "assignees"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.linkedPullRequests != null) {
        for (let i0 = 0; i0 < item.linkedPullRequests.length; i0++) {
          stack.push({
            entityType: "PullRequest",
            item: item.linkedPullRequests[i0],
            keyPath: [...[...keyPath, "linkedPullRequests"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getRepositoriesByIdCommits.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetRepositoriesByIdCommits(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "Commit",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdCommits",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdCommits",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdCommits",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdCommits",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "PullRequest",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdCommits",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Comment",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdCommits",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Issue",
          id: item._id,
          keyPath,
          queryName: "getRepositoriesByIdCommits",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getRepositoriesByIdCommits") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetRepositoriesByIdCommits(
      data,
      (item) =>
        batch.push({ entityType: "Commit", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "PullRequest", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Comment", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Issue", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getRepositoriesByIdCommits") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetRepositoriesByIdCommits(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "Commit",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "PullRequest",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Comment",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Issue",
            id: item._id,
            queryCacheKey,
          }),
      );
    }
    if (newData) {
      walkGetRepositoriesByIdCommits(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Commit",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "PullRequest",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Comment",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Issue",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetIssues(
  data: any,
  onIssue: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
  onComment: (item: any, keyPath: (string | number)[]) => void,
  onPullRequest: (item: any, keyPath: (string | number)[]) => void,
  onCommit: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "Issue"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
    | { entityType: "Comment"; item: any; keyPath: (string | number)[] }
    | { entityType: "PullRequest"; item: any; keyPath: (string | number)[] }
    | { entityType: "Commit"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({ entityType: "Issue", item: data[i0], keyPath: [...[], i0] });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "Issue") {
      const { item, keyPath } = entry;
      onIssue(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.assignees != null) {
        for (let i0 = 0; i0 < item.assignees.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.assignees[i0],
            keyPath: [...[...keyPath, "assignees"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.linkedPullRequests != null) {
        for (let i0 = 0; i0 < item.linkedPullRequests.length; i0++) {
          stack.push({
            entityType: "PullRequest",
            item: item.linkedPullRequests[i0],
            keyPath: [...[...keyPath, "linkedPullRequests"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    } else if (entry.entityType === "Comment") {
      const { item, keyPath } = entry;
      onComment(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.replies != null) {
        for (let i0 = 0; i0 < item.replies.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.replies[i0],
            keyPath: [...[...keyPath, "replies"], i0],
          });
        }
      }
      if (item.parentComment != null) {
        stack.push({
          entityType: "Comment",
          item: item.parentComment,
          keyPath: [...keyPath, "parentComment"],
        });
      }
    } else if (entry.entityType === "PullRequest") {
      const { item, keyPath } = entry;
      onPullRequest(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.reviewers != null) {
        for (let i0 = 0; i0 < item.reviewers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.reviewers[i0],
            keyPath: [...[...keyPath, "reviewers"], i0],
          });
        }
      }
      if (item.commits != null) {
        for (let i0 = 0; i0 < item.commits.length; i0++) {
          stack.push({
            entityType: "Commit",
            item: item.commits[i0],
            keyPath: [...[...keyPath, "commits"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.resolvedIssues != null) {
        for (let i0 = 0; i0 < item.resolvedIssues.length; i0++) {
          stack.push({
            entityType: "Issue",
            item: item.resolvedIssues[i0],
            keyPath: [...[...keyPath, "resolvedIssues"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "Commit") {
      const { item, keyPath } = entry;
      onCommit(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.coAuthors != null) {
        for (let i0 = 0; i0 < item.coAuthors.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.coAuthors[i0],
            keyPath: [...[...keyPath, "coAuthors"], i0],
          });
        }
      }
      if (item.pullRequest != null) {
        stack.push({
          entityType: "PullRequest",
          item: item.pullRequest,
          keyPath: [...keyPath, "pullRequest"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getIssues.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetIssues(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "Issue",
          id: item._id,
          keyPath,
          queryName: "getIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Comment",
          id: item._id,
          keyPath,
          queryName: "getIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "PullRequest",
          id: item._id,
          keyPath,
          queryName: "getIssues",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Commit",
          id: item._id,
          keyPath,
          queryName: "getIssues",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getIssues") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetIssues(
      data,
      (item) =>
        batch.push({ entityType: "Issue", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Comment", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "PullRequest", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Commit", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getIssues") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetIssues(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "Issue",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Comment",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "PullRequest",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Commit",
            id: item._id,
            queryCacheKey,
          }),
      );
    }
    if (newData) {
      walkGetIssues(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Issue",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Comment",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "PullRequest",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Commit",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetIssuesSearch(
  data: any,
  onIssue: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
  onComment: (item: any, keyPath: (string | number)[]) => void,
  onPullRequest: (item: any, keyPath: (string | number)[]) => void,
  onCommit: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "Issue"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
    | { entityType: "Comment"; item: any; keyPath: (string | number)[] }
    | { entityType: "PullRequest"; item: any; keyPath: (string | number)[] }
    | { entityType: "Commit"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({ entityType: "Issue", item: data[i0], keyPath: [...[], i0] });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "Issue") {
      const { item, keyPath } = entry;
      onIssue(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.assignees != null) {
        for (let i0 = 0; i0 < item.assignees.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.assignees[i0],
            keyPath: [...[...keyPath, "assignees"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.linkedPullRequests != null) {
        for (let i0 = 0; i0 < item.linkedPullRequests.length; i0++) {
          stack.push({
            entityType: "PullRequest",
            item: item.linkedPullRequests[i0],
            keyPath: [...[...keyPath, "linkedPullRequests"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    } else if (entry.entityType === "Comment") {
      const { item, keyPath } = entry;
      onComment(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.replies != null) {
        for (let i0 = 0; i0 < item.replies.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.replies[i0],
            keyPath: [...[...keyPath, "replies"], i0],
          });
        }
      }
      if (item.parentComment != null) {
        stack.push({
          entityType: "Comment",
          item: item.parentComment,
          keyPath: [...keyPath, "parentComment"],
        });
      }
    } else if (entry.entityType === "PullRequest") {
      const { item, keyPath } = entry;
      onPullRequest(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.reviewers != null) {
        for (let i0 = 0; i0 < item.reviewers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.reviewers[i0],
            keyPath: [...[...keyPath, "reviewers"], i0],
          });
        }
      }
      if (item.commits != null) {
        for (let i0 = 0; i0 < item.commits.length; i0++) {
          stack.push({
            entityType: "Commit",
            item: item.commits[i0],
            keyPath: [...[...keyPath, "commits"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.resolvedIssues != null) {
        for (let i0 = 0; i0 < item.resolvedIssues.length; i0++) {
          stack.push({
            entityType: "Issue",
            item: item.resolvedIssues[i0],
            keyPath: [...[...keyPath, "resolvedIssues"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "Commit") {
      const { item, keyPath } = entry;
      onCommit(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.coAuthors != null) {
        for (let i0 = 0; i0 < item.coAuthors.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.coAuthors[i0],
            keyPath: [...[...keyPath, "coAuthors"], i0],
          });
        }
      }
      if (item.pullRequest != null) {
        stack.push({
          entityType: "PullRequest",
          item: item.pullRequest,
          keyPath: [...keyPath, "pullRequest"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getIssuesSearch.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetIssuesSearch(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "Issue",
          id: item._id,
          keyPath,
          queryName: "getIssuesSearch",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getIssuesSearch",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getIssuesSearch",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getIssuesSearch",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Comment",
          id: item._id,
          keyPath,
          queryName: "getIssuesSearch",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "PullRequest",
          id: item._id,
          keyPath,
          queryName: "getIssuesSearch",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Commit",
          id: item._id,
          keyPath,
          queryName: "getIssuesSearch",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getIssuesSearch") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetIssuesSearch(
      data,
      (item) =>
        batch.push({ entityType: "Issue", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Comment", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "PullRequest", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Commit", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getIssuesSearch") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetIssuesSearch(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "Issue",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Comment",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "PullRequest",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Commit",
            id: item._id,
            queryCacheKey,
          }),
      );
    }
    if (newData) {
      walkGetIssuesSearch(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Issue",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Comment",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "PullRequest",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Commit",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetIssuesById(
  data: any,
  onIssue: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
  onComment: (item: any, keyPath: (string | number)[]) => void,
  onPullRequest: (item: any, keyPath: (string | number)[]) => void,
  onCommit: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "Issue"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
    | { entityType: "Comment"; item: any; keyPath: (string | number)[] }
    | { entityType: "PullRequest"; item: any; keyPath: (string | number)[] }
    | { entityType: "Commit"; item: any; keyPath: (string | number)[] }
  > = [];
  if (data.issue != null) {
    stack.push({
      entityType: "Issue",
      item: data.issue,
      keyPath: [...[], "issue"],
    });
  }
  if (data.comments != null) {
    for (let i0 = 0; i0 < data.comments.length; i0++) {
      stack.push({
        entityType: "Comment",
        item: data.comments[i0],
        keyPath: [...[...[], "comments"], i0],
      });
    }
  }
  if (data.linkedPullRequests != null) {
    for (let i0 = 0; i0 < data.linkedPullRequests.length; i0++) {
      stack.push({
        entityType: "PullRequest",
        item: data.linkedPullRequests[i0],
        keyPath: [...[...[], "linkedPullRequests"], i0],
      });
    }
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "Issue") {
      const { item, keyPath } = entry;
      onIssue(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.assignees != null) {
        for (let i0 = 0; i0 < item.assignees.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.assignees[i0],
            keyPath: [...[...keyPath, "assignees"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.linkedPullRequests != null) {
        for (let i0 = 0; i0 < item.linkedPullRequests.length; i0++) {
          stack.push({
            entityType: "PullRequest",
            item: item.linkedPullRequests[i0],
            keyPath: [...[...keyPath, "linkedPullRequests"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    } else if (entry.entityType === "Comment") {
      const { item, keyPath } = entry;
      onComment(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.replies != null) {
        for (let i0 = 0; i0 < item.replies.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.replies[i0],
            keyPath: [...[...keyPath, "replies"], i0],
          });
        }
      }
      if (item.parentComment != null) {
        stack.push({
          entityType: "Comment",
          item: item.parentComment,
          keyPath: [...keyPath, "parentComment"],
        });
      }
    } else if (entry.entityType === "PullRequest") {
      const { item, keyPath } = entry;
      onPullRequest(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.reviewers != null) {
        for (let i0 = 0; i0 < item.reviewers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.reviewers[i0],
            keyPath: [...[...keyPath, "reviewers"], i0],
          });
        }
      }
      if (item.commits != null) {
        for (let i0 = 0; i0 < item.commits.length; i0++) {
          stack.push({
            entityType: "Commit",
            item: item.commits[i0],
            keyPath: [...[...keyPath, "commits"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.resolvedIssues != null) {
        for (let i0 = 0; i0 < item.resolvedIssues.length; i0++) {
          stack.push({
            entityType: "Issue",
            item: item.resolvedIssues[i0],
            keyPath: [...[...keyPath, "resolvedIssues"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "Commit") {
      const { item, keyPath } = entry;
      onCommit(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.coAuthors != null) {
        for (let i0 = 0; i0 < item.coAuthors.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.coAuthors[i0],
            keyPath: [...[...keyPath, "coAuthors"], i0],
          });
        }
      }
      if (item.pullRequest != null) {
        stack.push({
          entityType: "PullRequest",
          item: item.pullRequest,
          keyPath: [...keyPath, "pullRequest"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getIssuesById.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetIssuesById(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "Issue",
          id: item._id,
          keyPath,
          queryName: "getIssuesById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getIssuesById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getIssuesById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getIssuesById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Comment",
          id: item._id,
          keyPath,
          queryName: "getIssuesById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "PullRequest",
          id: item._id,
          keyPath,
          queryName: "getIssuesById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Commit",
          id: item._id,
          keyPath,
          queryName: "getIssuesById",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getIssuesById") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetIssuesById(
      data,
      (item) =>
        batch.push({ entityType: "Issue", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Comment", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "PullRequest", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Commit", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getIssuesById") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetIssuesById(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "Issue",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Comment",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "PullRequest",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Commit",
            id: item._id,
            queryCacheKey,
          }),
      );
    }
    if (newData) {
      walkGetIssuesById(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Issue",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Comment",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "PullRequest",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Commit",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetPullRequests(
  data: any,
  onPullRequest: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
  onCommit: (item: any, keyPath: (string | number)[]) => void,
  onComment: (item: any, keyPath: (string | number)[]) => void,
  onIssue: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "PullRequest"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
    | { entityType: "Commit"; item: any; keyPath: (string | number)[] }
    | { entityType: "Comment"; item: any; keyPath: (string | number)[] }
    | { entityType: "Issue"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({
      entityType: "PullRequest",
      item: data[i0],
      keyPath: [...[], i0],
    });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "PullRequest") {
      const { item, keyPath } = entry;
      onPullRequest(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.reviewers != null) {
        for (let i0 = 0; i0 < item.reviewers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.reviewers[i0],
            keyPath: [...[...keyPath, "reviewers"], i0],
          });
        }
      }
      if (item.commits != null) {
        for (let i0 = 0; i0 < item.commits.length; i0++) {
          stack.push({
            entityType: "Commit",
            item: item.commits[i0],
            keyPath: [...[...keyPath, "commits"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.resolvedIssues != null) {
        for (let i0 = 0; i0 < item.resolvedIssues.length; i0++) {
          stack.push({
            entityType: "Issue",
            item: item.resolvedIssues[i0],
            keyPath: [...[...keyPath, "resolvedIssues"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    } else if (entry.entityType === "Commit") {
      const { item, keyPath } = entry;
      onCommit(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.coAuthors != null) {
        for (let i0 = 0; i0 < item.coAuthors.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.coAuthors[i0],
            keyPath: [...[...keyPath, "coAuthors"], i0],
          });
        }
      }
      if (item.pullRequest != null) {
        stack.push({
          entityType: "PullRequest",
          item: item.pullRequest,
          keyPath: [...keyPath, "pullRequest"],
        });
      }
    } else if (entry.entityType === "Comment") {
      const { item, keyPath } = entry;
      onComment(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.replies != null) {
        for (let i0 = 0; i0 < item.replies.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.replies[i0],
            keyPath: [...[...keyPath, "replies"], i0],
          });
        }
      }
      if (item.parentComment != null) {
        stack.push({
          entityType: "Comment",
          item: item.parentComment,
          keyPath: [...keyPath, "parentComment"],
        });
      }
    } else if (entry.entityType === "Issue") {
      const { item, keyPath } = entry;
      onIssue(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.assignees != null) {
        for (let i0 = 0; i0 < item.assignees.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.assignees[i0],
            keyPath: [...[...keyPath, "assignees"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.linkedPullRequests != null) {
        for (let i0 = 0; i0 < item.linkedPullRequests.length; i0++) {
          stack.push({
            entityType: "PullRequest",
            item: item.linkedPullRequests[i0],
            keyPath: [...[...keyPath, "linkedPullRequests"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getPullRequests.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetPullRequests(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "PullRequest",
          id: item._id,
          keyPath,
          queryName: "getPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Commit",
          id: item._id,
          keyPath,
          queryName: "getPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Comment",
          id: item._id,
          keyPath,
          queryName: "getPullRequests",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Issue",
          id: item._id,
          keyPath,
          queryName: "getPullRequests",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getPullRequests") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetPullRequests(
      data,
      (item) =>
        batch.push({ entityType: "PullRequest", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Commit", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Comment", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Issue", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getPullRequests") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetPullRequests(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "PullRequest",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Commit",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Comment",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Issue",
            id: item._id,
            queryCacheKey,
          }),
      );
    }
    if (newData) {
      walkGetPullRequests(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "PullRequest",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Commit",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Comment",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Issue",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetPullRequestsById(
  data: any,
  onPullRequest: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
  onCommit: (item: any, keyPath: (string | number)[]) => void,
  onComment: (item: any, keyPath: (string | number)[]) => void,
  onIssue: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "PullRequest"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
    | { entityType: "Commit"; item: any; keyPath: (string | number)[] }
    | { entityType: "Comment"; item: any; keyPath: (string | number)[] }
    | { entityType: "Issue"; item: any; keyPath: (string | number)[] }
  > = [];
  if (data.pullRequest != null) {
    stack.push({
      entityType: "PullRequest",
      item: data.pullRequest,
      keyPath: [...[], "pullRequest"],
    });
  }
  if (data.commits != null) {
    for (let i0 = 0; i0 < data.commits.length; i0++) {
      stack.push({
        entityType: "Commit",
        item: data.commits[i0],
        keyPath: [...[...[], "commits"], i0],
      });
    }
  }
  if (data.comments != null) {
    for (let i0 = 0; i0 < data.comments.length; i0++) {
      stack.push({
        entityType: "Comment",
        item: data.comments[i0],
        keyPath: [...[...[], "comments"], i0],
      });
    }
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "PullRequest") {
      const { item, keyPath } = entry;
      onPullRequest(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.reviewers != null) {
        for (let i0 = 0; i0 < item.reviewers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.reviewers[i0],
            keyPath: [...[...keyPath, "reviewers"], i0],
          });
        }
      }
      if (item.commits != null) {
        for (let i0 = 0; i0 < item.commits.length; i0++) {
          stack.push({
            entityType: "Commit",
            item: item.commits[i0],
            keyPath: [...[...keyPath, "commits"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.resolvedIssues != null) {
        for (let i0 = 0; i0 < item.resolvedIssues.length; i0++) {
          stack.push({
            entityType: "Issue",
            item: item.resolvedIssues[i0],
            keyPath: [...[...keyPath, "resolvedIssues"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    } else if (entry.entityType === "Commit") {
      const { item, keyPath } = entry;
      onCommit(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.coAuthors != null) {
        for (let i0 = 0; i0 < item.coAuthors.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.coAuthors[i0],
            keyPath: [...[...keyPath, "coAuthors"], i0],
          });
        }
      }
      if (item.pullRequest != null) {
        stack.push({
          entityType: "PullRequest",
          item: item.pullRequest,
          keyPath: [...keyPath, "pullRequest"],
        });
      }
    } else if (entry.entityType === "Comment") {
      const { item, keyPath } = entry;
      onComment(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.replies != null) {
        for (let i0 = 0; i0 < item.replies.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.replies[i0],
            keyPath: [...[...keyPath, "replies"], i0],
          });
        }
      }
      if (item.parentComment != null) {
        stack.push({
          entityType: "Comment",
          item: item.parentComment,
          keyPath: [...keyPath, "parentComment"],
        });
      }
    } else if (entry.entityType === "Issue") {
      const { item, keyPath } = entry;
      onIssue(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.assignees != null) {
        for (let i0 = 0; i0 < item.assignees.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.assignees[i0],
            keyPath: [...[...keyPath, "assignees"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.linkedPullRequests != null) {
        for (let i0 = 0; i0 < item.linkedPullRequests.length; i0++) {
          stack.push({
            entityType: "PullRequest",
            item: item.linkedPullRequests[i0],
            keyPath: [...[...keyPath, "linkedPullRequests"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getPullRequestsById.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetPullRequestsById(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "PullRequest",
          id: item._id,
          keyPath,
          queryName: "getPullRequestsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getPullRequestsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getPullRequestsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getPullRequestsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Commit",
          id: item._id,
          keyPath,
          queryName: "getPullRequestsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Comment",
          id: item._id,
          keyPath,
          queryName: "getPullRequestsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Issue",
          id: item._id,
          keyPath,
          queryName: "getPullRequestsById",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getPullRequestsById") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetPullRequestsById(
      data,
      (item) =>
        batch.push({ entityType: "PullRequest", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Commit", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Comment", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Issue", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getPullRequestsById") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetPullRequestsById(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "PullRequest",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Commit",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Comment",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Issue",
            id: item._id,
            queryCacheKey,
          }),
      );
    }
    if (newData) {
      walkGetPullRequestsById(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "PullRequest",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Commit",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Comment",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Issue",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetPullRequestsByIdReviews(
  data: any,
  onReviewThread: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
  onComment: (item: any, keyPath: (string | number)[]) => void,
  onPullRequest: (item: any, keyPath: (string | number)[]) => void,
  onCommit: (item: any, keyPath: (string | number)[]) => void,
  onIssue: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "ReviewThread"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
    | { entityType: "Comment"; item: any; keyPath: (string | number)[] }
    | { entityType: "PullRequest"; item: any; keyPath: (string | number)[] }
    | { entityType: "Commit"; item: any; keyPath: (string | number)[] }
    | { entityType: "Issue"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({
      entityType: "ReviewThread",
      item: data[i0],
      keyPath: [...[], i0],
    });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "ReviewThread") {
      const { item, keyPath } = entry;
      onReviewThread(item, keyPath);
      if (item.resolvedBy != null) {
        stack.push({
          entityType: "User",
          item: item.resolvedBy,
          keyPath: [...keyPath, "resolvedBy"],
        });
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.pullRequest != null) {
        stack.push({
          entityType: "PullRequest",
          item: item.pullRequest,
          keyPath: [...keyPath, "pullRequest"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    } else if (entry.entityType === "Comment") {
      const { item, keyPath } = entry;
      onComment(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.replies != null) {
        for (let i0 = 0; i0 < item.replies.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.replies[i0],
            keyPath: [...[...keyPath, "replies"], i0],
          });
        }
      }
      if (item.parentComment != null) {
        stack.push({
          entityType: "Comment",
          item: item.parentComment,
          keyPath: [...keyPath, "parentComment"],
        });
      }
    } else if (entry.entityType === "PullRequest") {
      const { item, keyPath } = entry;
      onPullRequest(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.reviewers != null) {
        for (let i0 = 0; i0 < item.reviewers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.reviewers[i0],
            keyPath: [...[...keyPath, "reviewers"], i0],
          });
        }
      }
      if (item.commits != null) {
        for (let i0 = 0; i0 < item.commits.length; i0++) {
          stack.push({
            entityType: "Commit",
            item: item.commits[i0],
            keyPath: [...[...keyPath, "commits"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.resolvedIssues != null) {
        for (let i0 = 0; i0 < item.resolvedIssues.length; i0++) {
          stack.push({
            entityType: "Issue",
            item: item.resolvedIssues[i0],
            keyPath: [...[...keyPath, "resolvedIssues"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "Commit") {
      const { item, keyPath } = entry;
      onCommit(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.coAuthors != null) {
        for (let i0 = 0; i0 < item.coAuthors.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.coAuthors[i0],
            keyPath: [...[...keyPath, "coAuthors"], i0],
          });
        }
      }
      if (item.pullRequest != null) {
        stack.push({
          entityType: "PullRequest",
          item: item.pullRequest,
          keyPath: [...keyPath, "pullRequest"],
        });
      }
    } else if (entry.entityType === "Issue") {
      const { item, keyPath } = entry;
      onIssue(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.assignees != null) {
        for (let i0 = 0; i0 < item.assignees.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.assignees[i0],
            keyPath: [...[...keyPath, "assignees"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.linkedPullRequests != null) {
        for (let i0 = 0; i0 < item.linkedPullRequests.length; i0++) {
          stack.push({
            entityType: "PullRequest",
            item: item.linkedPullRequests[i0],
            keyPath: [...[...keyPath, "linkedPullRequests"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getPullRequestsByIdReviews.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetPullRequestsByIdReviews(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "ReviewThread",
          id: item._id,
          keyPath,
          queryName: "getPullRequestsByIdReviews",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getPullRequestsByIdReviews",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getPullRequestsByIdReviews",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getPullRequestsByIdReviews",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Comment",
          id: item._id,
          keyPath,
          queryName: "getPullRequestsByIdReviews",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "PullRequest",
          id: item._id,
          keyPath,
          queryName: "getPullRequestsByIdReviews",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Commit",
          id: item._id,
          keyPath,
          queryName: "getPullRequestsByIdReviews",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Issue",
          id: item._id,
          keyPath,
          queryName: "getPullRequestsByIdReviews",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getPullRequestsByIdReviews") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetPullRequestsByIdReviews(
      data,
      (item) =>
        batch.push({ entityType: "ReviewThread", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Comment", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "PullRequest", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Commit", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Issue", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getPullRequestsByIdReviews") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetPullRequestsByIdReviews(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "ReviewThread",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Comment",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "PullRequest",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Commit",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Issue",
            id: item._id,
            queryCacheKey,
          }),
      );
    }
    if (newData) {
      walkGetPullRequestsByIdReviews(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "ReviewThread",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Comment",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "PullRequest",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Commit",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Issue",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetTeams(
  data: any,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
  > = [];
  for (let i0 = 0; i0 < data.length; i0++) {
    stack.push({ entityType: "Team", item: data[i0], keyPath: [...[], i0] });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getTeams.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetTeams(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getTeams",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getTeams",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getTeams",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getTeams") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetTeams(
      data,
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getTeams") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetTeams(
        oldData,
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
      );
    }
    if (newData) {
      walkGetTeams(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetTeamsById(
  data: any,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
  > = [];
  if (data.team != null) {
    stack.push({
      entityType: "Team",
      item: data.team,
      keyPath: [...[], "team"],
    });
  }
  if (data.members != null) {
    for (let i0 = 0; i0 < data.members.length; i0++) {
      stack.push({
        entityType: "User",
        item: data.members[i0],
        keyPath: [...[...[], "members"], i0],
      });
    }
  }
  if (data.subTeams != null) {
    for (let i0 = 0; i0 < data.subTeams.length; i0++) {
      stack.push({
        entityType: "Team",
        item: data.subTeams[i0],
        keyPath: [...[...[], "subTeams"], i0],
      });
    }
  }
  if (data.repositories != null) {
    for (let i0 = 0; i0 < data.repositories.length; i0++) {
      stack.push({
        entityType: "Repository",
        item: data.repositories[i0],
        keyPath: [...[...[], "repositories"], i0],
      });
    }
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getTeamsById.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetTeamsById(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getTeamsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getTeamsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getTeamsById",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getTeamsById") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetTeamsById(
      data,
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getTeamsById") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetTeamsById(
        oldData,
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
      );
    }
    if (newData) {
      walkGetTeamsById(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetCommitsById(
  data: any,
  onCommit: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
  onPullRequest: (item: any, keyPath: (string | number)[]) => void,
  onComment: (item: any, keyPath: (string | number)[]) => void,
  onIssue: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "Commit"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
    | { entityType: "PullRequest"; item: any; keyPath: (string | number)[] }
    | { entityType: "Comment"; item: any; keyPath: (string | number)[] }
    | { entityType: "Issue"; item: any; keyPath: (string | number)[] }
  > = [];
  if (data.commit != null) {
    stack.push({
      entityType: "Commit",
      item: data.commit,
      keyPath: [...[], "commit"],
    });
  }
  if (data.coAuthors != null) {
    for (let i0 = 0; i0 < data.coAuthors.length; i0++) {
      stack.push({
        entityType: "User",
        item: data.coAuthors[i0],
        keyPath: [...[...[], "coAuthors"], i0],
      });
    }
  }
  if (data.pullRequest != null) {
    stack.push({
      entityType: "PullRequest",
      item: data.pullRequest,
      keyPath: [...[], "pullRequest"],
    });
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "Commit") {
      const { item, keyPath } = entry;
      onCommit(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.coAuthors != null) {
        for (let i0 = 0; i0 < item.coAuthors.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.coAuthors[i0],
            keyPath: [...[...keyPath, "coAuthors"], i0],
          });
        }
      }
      if (item.pullRequest != null) {
        stack.push({
          entityType: "PullRequest",
          item: item.pullRequest,
          keyPath: [...keyPath, "pullRequest"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    } else if (entry.entityType === "PullRequest") {
      const { item, keyPath } = entry;
      onPullRequest(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.reviewers != null) {
        for (let i0 = 0; i0 < item.reviewers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.reviewers[i0],
            keyPath: [...[...keyPath, "reviewers"], i0],
          });
        }
      }
      if (item.commits != null) {
        for (let i0 = 0; i0 < item.commits.length; i0++) {
          stack.push({
            entityType: "Commit",
            item: item.commits[i0],
            keyPath: [...[...keyPath, "commits"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.resolvedIssues != null) {
        for (let i0 = 0; i0 < item.resolvedIssues.length; i0++) {
          stack.push({
            entityType: "Issue",
            item: item.resolvedIssues[i0],
            keyPath: [...[...keyPath, "resolvedIssues"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    } else if (entry.entityType === "Comment") {
      const { item, keyPath } = entry;
      onComment(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.replies != null) {
        for (let i0 = 0; i0 < item.replies.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.replies[i0],
            keyPath: [...[...keyPath, "replies"], i0],
          });
        }
      }
      if (item.parentComment != null) {
        stack.push({
          entityType: "Comment",
          item: item.parentComment,
          keyPath: [...keyPath, "parentComment"],
        });
      }
    } else if (entry.entityType === "Issue") {
      const { item, keyPath } = entry;
      onIssue(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.assignees != null) {
        for (let i0 = 0; i0 < item.assignees.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.assignees[i0],
            keyPath: [...[...keyPath, "assignees"], i0],
          });
        }
      }
      if (item.comments != null) {
        for (let i0 = 0; i0 < item.comments.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.comments[i0],
            keyPath: [...[...keyPath, "comments"], i0],
          });
        }
      }
      if (item.linkedPullRequests != null) {
        for (let i0 = 0; i0 < item.linkedPullRequests.length; i0++) {
          stack.push({
            entityType: "PullRequest",
            item: item.linkedPullRequests[i0],
            keyPath: [...[...keyPath, "linkedPullRequests"], i0],
          });
        }
      }
      if (item.repository != null) {
        stack.push({
          entityType: "Repository",
          item: item.repository,
          keyPath: [...keyPath, "repository"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getCommitsById.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetCommitsById(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "Commit",
          id: item._id,
          keyPath,
          queryName: "getCommitsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getCommitsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getCommitsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getCommitsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "PullRequest",
          id: item._id,
          keyPath,
          queryName: "getCommitsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Comment",
          id: item._id,
          keyPath,
          queryName: "getCommitsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Issue",
          id: item._id,
          keyPath,
          queryName: "getCommitsById",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getCommitsById") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetCommitsById(
      data,
      (item) =>
        batch.push({ entityType: "Commit", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "PullRequest", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Comment", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Issue", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getCommitsById") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetCommitsById(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "Commit",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "PullRequest",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Comment",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Issue",
            id: item._id,
            queryCacheKey,
          }),
      );
    }
    if (newData) {
      walkGetCommitsById(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Commit",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "PullRequest",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Comment",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Issue",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});

function walkGetCommentsById(
  data: any,
  onComment: (item: any, keyPath: (string | number)[]) => void,
  onUser: (item: any, keyPath: (string | number)[]) => void,
  onRepository: (item: any, keyPath: (string | number)[]) => void,
  onTeam: (item: any, keyPath: (string | number)[]) => void,
) {
  const stack: Array<
    | { entityType: "Comment"; item: any; keyPath: (string | number)[] }
    | { entityType: "User"; item: any; keyPath: (string | number)[] }
    | { entityType: "Repository"; item: any; keyPath: (string | number)[] }
    | { entityType: "Team"; item: any; keyPath: (string | number)[] }
  > = [];
  if (data.comment != null) {
    stack.push({
      entityType: "Comment",
      item: data.comment,
      keyPath: [...[], "comment"],
    });
  }
  if (data.replies != null) {
    for (let i0 = 0; i0 < data.replies.length; i0++) {
      stack.push({
        entityType: "Comment",
        item: data.replies[i0],
        keyPath: [...[...[], "replies"], i0],
      });
    }
  }
  while (stack.length > 0) {
    const entry = stack.shift()!;
    if (entry.entityType === "Comment") {
      const { item, keyPath } = entry;
      onComment(item, keyPath);
      if (item.author != null) {
        stack.push({
          entityType: "User",
          item: item.author,
          keyPath: [...keyPath, "author"],
        });
      }
      if (item.replies != null) {
        for (let i0 = 0; i0 < item.replies.length; i0++) {
          stack.push({
            entityType: "Comment",
            item: item.replies[i0],
            keyPath: [...[...keyPath, "replies"], i0],
          });
        }
      }
      if (item.parentComment != null) {
        stack.push({
          entityType: "Comment",
          item: item.parentComment,
          keyPath: [...keyPath, "parentComment"],
        });
      }
    } else if (entry.entityType === "User") {
      const { item, keyPath } = entry;
      onUser(item, keyPath);
      if (item.followers != null) {
        for (let i0 = 0; i0 < item.followers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.followers[i0],
            keyPath: [...[...keyPath, "followers"], i0],
          });
        }
      }
      if (item.following != null) {
        for (let i0 = 0; i0 < item.following.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.following[i0],
            keyPath: [...[...keyPath, "following"], i0],
          });
        }
      }
      if (item.pinnedRepositories != null) {
        for (let i0 = 0; i0 < item.pinnedRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.pinnedRepositories[i0],
            keyPath: [...[...keyPath, "pinnedRepositories"], i0],
          });
        }
      }
      if (item.starredRepositories != null) {
        for (let i0 = 0; i0 < item.starredRepositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.starredRepositories[i0],
            keyPath: [...[...keyPath, "starredRepositories"], i0],
          });
        }
      }
      if (item.teams != null) {
        for (let i0 = 0; i0 < item.teams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.teams[i0],
            keyPath: [...[...keyPath, "teams"], i0],
          });
        }
      }
    } else if (entry.entityType === "Repository") {
      const { item, keyPath } = entry;
      onRepository(item, keyPath);
      if (item.owner != null) {
        stack.push({
          entityType: "User",
          item: item.owner,
          keyPath: [...keyPath, "owner"],
        });
      }
      if (item.collaborators != null) {
        for (let i0 = 0; i0 < item.collaborators.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.collaborators[i0],
            keyPath: [...[...keyPath, "collaborators"], i0],
          });
        }
      }
      if (item.stargazers != null) {
        for (let i0 = 0; i0 < item.stargazers.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.stargazers[i0],
            keyPath: [...[...keyPath, "stargazers"], i0],
          });
        }
      }
      if (item.forks != null) {
        for (let i0 = 0; i0 < item.forks.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.forks[i0],
            keyPath: [...[...keyPath, "forks"], i0],
          });
        }
      }
      if (item.parentFork != null) {
        stack.push({
          entityType: "Repository",
          item: item.parentFork,
          keyPath: [...keyPath, "parentFork"],
        });
      }
    } else if (entry.entityType === "Team") {
      const { item, keyPath } = entry;
      onTeam(item, keyPath);
      if (item.members != null) {
        for (let i0 = 0; i0 < item.members.length; i0++) {
          stack.push({
            entityType: "User",
            item: item.members[i0],
            keyPath: [...[...keyPath, "members"], i0],
          });
        }
      }
      if (item.repositories != null) {
        for (let i0 = 0; i0 < item.repositories.length; i0++) {
          stack.push({
            entityType: "Repository",
            item: item.repositories[i0],
            keyPath: [...[...keyPath, "repositories"], i0],
          });
        }
      }
      if (item.subTeams != null) {
        for (let i0 = 0; i0 < item.subTeams.length; i0++) {
          stack.push({
            entityType: "Team",
            item: item.subTeams[i0],
            keyPath: [...[...keyPath, "subTeams"], i0],
          });
        }
      }
      if (item.parentTeam != null) {
        stack.push({
          entityType: "Team",
          item: item.parentTeam,
          keyPath: [...keyPath, "parentTeam"],
        });
      }
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getCommentsById.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetCommentsById(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "Comment",
          id: item._id,
          keyPath,
          queryName: "getCommentsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "User",
          id: item._id,
          keyPath,
          queryName: "getCommentsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Repository",
          id: item._id,
          keyPath,
          queryName: "getCommentsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Team",
          id: item._id,
          keyPath,
          queryName: "getCommentsById",
          queryArgs: arg,
        }),
    );
    if (batch.length) {
      dispatch(entityLoaded(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getCommentsById") {
      return;
    }
    const data = query.data as any;
    if (!data) {
      return;
    }
    const batch: any[] = [];
    walkGetCommentsById(
      data,
      (item) =>
        batch.push({ entityType: "Comment", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "User", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Repository", id: item._id, queryCacheKey }),
      (item) => batch.push({ entityType: "Team", id: item._id, queryCacheKey }),
    );
    if (batch.length) {
      dispatch(entityRemoved(batch));
    }
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if (
      "fromEntityUpdate" in action.payload &&
      action.payload.fromEntityUpdate
    ) {
      return;
    }
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getCommentsById") {
      return;
    }
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData) {
      walkGetCommentsById(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "Comment",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "User", id: item._id, queryCacheKey }),
        (item) =>
          removeBatch.push({
            entityType: "Repository",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({ entityType: "Team", id: item._id, queryCacheKey }),
      );
    }
    if (newData) {
      walkGetCommentsById(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Comment",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "User",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Repository",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Team",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    }
    if (removeBatch.length) {
      dispatch(entityRemoved(removeBatch));
    }
    if (loadBatch.length) {
      dispatch(entityLoaded(loadBatch));
    }
  },
});
