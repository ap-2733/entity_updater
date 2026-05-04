/* eslint-disable @typescript-eslint/no-explicit-any */
import { entityIdFields } from "./entityIdFields";

export function* walkEntityType(
  typeName:
    | "User"
    | "Repository"
    | "Team"
    | "Issue"
    | "Comment"
    | "PullRequest"
    | "Commit"
    | "ReviewThread",
  id: string,
  queries: Record<string, { endpointName: string; data: any }>,
  callback: (item: any, keyPath: (string | number)[]) => void,
  timeoutMs: number,
): Generator<void> {
  const idField = entityIdFields[typeName];
  let deadline = performance.now() + timeoutMs;
  let counter = 0;
  for (const [queryCacheKey, query] of Object.entries(queries)) {
    if (++counter % 1000 === 0) {
      const now = performance.now();
      if (now > deadline) {
        deadline = now + timeoutMs;
        timeoutMs = yield;
      }
    }
    if (!query.data) continue;
    if (typeName === "User") {
      if (
        query.endpointName === "getUsers" ||
        query.endpointName === "getUsersSearch" ||
        query.endpointName === "getRepositoriesByIdStargazers"
      ) {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        for (let i0 = 0; i0 < query.data.length; i0++) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          stack.push({
            item: query.data[i0],
            keyPath: [...[queryCacheKey], i0],
          });
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.followers != null) {
            for (let i0 = 0; i0 < item.followers.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.followers[i0],
                keyPath: [...[...keyPath, "followers"], i0],
              });
            }
          }
          if (item.following != null) {
            for (let i0 = 0; i0 < item.following.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.following[i0],
                keyPath: [...[...keyPath, "following"], i0],
              });
            }
          }
        }
      } else if (query.endpointName === "getUsersById") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        if (query.data.user != null) {
          stack.push({
            item: query.data.user,
            keyPath: [...[queryCacheKey], "user"],
          });
        }
        if (query.data.followers != null) {
          for (let i0 = 0; i0 < query.data.followers.length; i0++) {
            if (++counter % 1000 === 0) {
              const now = performance.now();
              if (now > deadline) {
                deadline = now + timeoutMs;
                timeoutMs = yield;
              }
            }
            stack.push({
              item: query.data.followers[i0],
              keyPath: [...[...[queryCacheKey], "followers"], i0],
            });
          }
        }
        if (query.data.following != null) {
          for (let i0 = 0; i0 < query.data.following.length; i0++) {
            if (++counter % 1000 === 0) {
              const now = performance.now();
              if (now > deadline) {
                deadline = now + timeoutMs;
                timeoutMs = yield;
              }
            }
            stack.push({
              item: query.data.following[i0],
              keyPath: [...[...[queryCacheKey], "following"], i0],
            });
          }
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.followers != null) {
            for (let i0 = 0; i0 < item.followers.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.followers[i0],
                keyPath: [...[...keyPath, "followers"], i0],
              });
            }
          }
          if (item.following != null) {
            for (let i0 = 0; i0 < item.following.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.following[i0],
                keyPath: [...[...keyPath, "following"], i0],
              });
            }
          }
        }
      } else if (
        query.endpointName === "getUsersByIdRepositories" ||
        query.endpointName === "getUsersByIdTeams" ||
        query.endpointName === "getUsersByIdIssues" ||
        query.endpointName === "getUsersByIdPullRequests" ||
        query.endpointName === "getRepositories" ||
        query.endpointName === "getRepositoriesSearch" ||
        query.endpointName === "getRepositoriesByIdIssues" ||
        query.endpointName === "getRepositoriesByIdPullRequests" ||
        query.endpointName === "getRepositoriesByIdCommits" ||
        query.endpointName === "getIssues" ||
        query.endpointName === "getIssuesSearch" ||
        query.endpointName === "getIssuesById" ||
        query.endpointName === "getPullRequests" ||
        query.endpointName === "getPullRequestsById" ||
        query.endpointName === "getPullRequestsByIdReviews" ||
        query.endpointName === "getTeams" ||
        query.endpointName === "getCommentsById"
      ) {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];

        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.followers != null) {
            for (let i0 = 0; i0 < item.followers.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.followers[i0],
                keyPath: [...[...keyPath, "followers"], i0],
              });
            }
          }
          if (item.following != null) {
            for (let i0 = 0; i0 < item.following.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.following[i0],
                keyPath: [...[...keyPath, "following"], i0],
              });
            }
          }
        }
      } else if (query.endpointName === "getRepositoriesById") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        if (query.data.collaborators != null) {
          for (let i0 = 0; i0 < query.data.collaborators.length; i0++) {
            if (++counter % 1000 === 0) {
              const now = performance.now();
              if (now > deadline) {
                deadline = now + timeoutMs;
                timeoutMs = yield;
              }
            }
            stack.push({
              item: query.data.collaborators[i0],
              keyPath: [...[...[queryCacheKey], "collaborators"], i0],
            });
          }
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.followers != null) {
            for (let i0 = 0; i0 < item.followers.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.followers[i0],
                keyPath: [...[...keyPath, "followers"], i0],
              });
            }
          }
          if (item.following != null) {
            for (let i0 = 0; i0 < item.following.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.following[i0],
                keyPath: [...[...keyPath, "following"], i0],
              });
            }
          }
        }
      } else if (query.endpointName === "getTeamsById") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        if (query.data.members != null) {
          for (let i0 = 0; i0 < query.data.members.length; i0++) {
            if (++counter % 1000 === 0) {
              const now = performance.now();
              if (now > deadline) {
                deadline = now + timeoutMs;
                timeoutMs = yield;
              }
            }
            stack.push({
              item: query.data.members[i0],
              keyPath: [...[...[queryCacheKey], "members"], i0],
            });
          }
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.followers != null) {
            for (let i0 = 0; i0 < item.followers.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.followers[i0],
                keyPath: [...[...keyPath, "followers"], i0],
              });
            }
          }
          if (item.following != null) {
            for (let i0 = 0; i0 < item.following.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.following[i0],
                keyPath: [...[...keyPath, "following"], i0],
              });
            }
          }
        }
      } else if (query.endpointName === "getCommitsById") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        if (query.data.coAuthors != null) {
          for (let i0 = 0; i0 < query.data.coAuthors.length; i0++) {
            if (++counter % 1000 === 0) {
              const now = performance.now();
              if (now > deadline) {
                deadline = now + timeoutMs;
                timeoutMs = yield;
              }
            }
            stack.push({
              item: query.data.coAuthors[i0],
              keyPath: [...[...[queryCacheKey], "coAuthors"], i0],
            });
          }
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.followers != null) {
            for (let i0 = 0; i0 < item.followers.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.followers[i0],
                keyPath: [...[...keyPath, "followers"], i0],
              });
            }
          }
          if (item.following != null) {
            for (let i0 = 0; i0 < item.following.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.following[i0],
                keyPath: [...[...keyPath, "following"], i0],
              });
            }
          }
        }
      }
    } else if (typeName === "Repository") {
      if (
        query.endpointName === "getUsers" ||
        query.endpointName === "getUsersSearch" ||
        query.endpointName === "getUsersById" ||
        query.endpointName === "getUsersByIdTeams" ||
        query.endpointName === "getUsersByIdIssues" ||
        query.endpointName === "getUsersByIdPullRequests" ||
        query.endpointName === "getRepositoriesByIdStargazers" ||
        query.endpointName === "getRepositoriesByIdIssues" ||
        query.endpointName === "getRepositoriesByIdPullRequests" ||
        query.endpointName === "getRepositoriesByIdCommits" ||
        query.endpointName === "getIssues" ||
        query.endpointName === "getIssuesSearch" ||
        query.endpointName === "getIssuesById" ||
        query.endpointName === "getPullRequests" ||
        query.endpointName === "getPullRequestsById" ||
        query.endpointName === "getPullRequestsByIdReviews" ||
        query.endpointName === "getTeams" ||
        query.endpointName === "getCommitsById" ||
        query.endpointName === "getCommentsById"
      ) {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];

        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.forks != null) {
            for (let i0 = 0; i0 < item.forks.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.forks[i0],
                keyPath: [...[...keyPath, "forks"], i0],
              });
            }
          }
          if (item.parentFork != null) {
            stack.push({
              item: item.parentFork,
              keyPath: [...keyPath, "parentFork"],
            });
          }
        }
      } else if (
        query.endpointName === "getUsersByIdRepositories" ||
        query.endpointName === "getRepositories" ||
        query.endpointName === "getRepositoriesSearch"
      ) {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        for (let i0 = 0; i0 < query.data.length; i0++) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          stack.push({
            item: query.data[i0],
            keyPath: [...[queryCacheKey], i0],
          });
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.forks != null) {
            for (let i0 = 0; i0 < item.forks.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.forks[i0],
                keyPath: [...[...keyPath, "forks"], i0],
              });
            }
          }
          if (item.parentFork != null) {
            stack.push({
              item: item.parentFork,
              keyPath: [...keyPath, "parentFork"],
            });
          }
        }
      } else if (query.endpointName === "getRepositoriesById") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        if (query.data.repository != null) {
          stack.push({
            item: query.data.repository,
            keyPath: [...[queryCacheKey], "repository"],
          });
        }
        if (query.data.forks != null) {
          for (let i0 = 0; i0 < query.data.forks.length; i0++) {
            if (++counter % 1000 === 0) {
              const now = performance.now();
              if (now > deadline) {
                deadline = now + timeoutMs;
                timeoutMs = yield;
              }
            }
            stack.push({
              item: query.data.forks[i0],
              keyPath: [...[...[queryCacheKey], "forks"], i0],
            });
          }
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.forks != null) {
            for (let i0 = 0; i0 < item.forks.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.forks[i0],
                keyPath: [...[...keyPath, "forks"], i0],
              });
            }
          }
          if (item.parentFork != null) {
            stack.push({
              item: item.parentFork,
              keyPath: [...keyPath, "parentFork"],
            });
          }
        }
      } else if (query.endpointName === "getTeamsById") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        if (query.data.repositories != null) {
          for (let i0 = 0; i0 < query.data.repositories.length; i0++) {
            if (++counter % 1000 === 0) {
              const now = performance.now();
              if (now > deadline) {
                deadline = now + timeoutMs;
                timeoutMs = yield;
              }
            }
            stack.push({
              item: query.data.repositories[i0],
              keyPath: [...[...[queryCacheKey], "repositories"], i0],
            });
          }
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.forks != null) {
            for (let i0 = 0; i0 < item.forks.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.forks[i0],
                keyPath: [...[...keyPath, "forks"], i0],
              });
            }
          }
          if (item.parentFork != null) {
            stack.push({
              item: item.parentFork,
              keyPath: [...keyPath, "parentFork"],
            });
          }
        }
      }
    } else if (typeName === "Team") {
      if (
        query.endpointName === "getUsers" ||
        query.endpointName === "getUsersSearch" ||
        query.endpointName === "getUsersById" ||
        query.endpointName === "getUsersByIdRepositories" ||
        query.endpointName === "getUsersByIdIssues" ||
        query.endpointName === "getUsersByIdPullRequests" ||
        query.endpointName === "getRepositories" ||
        query.endpointName === "getRepositoriesSearch" ||
        query.endpointName === "getRepositoriesById" ||
        query.endpointName === "getRepositoriesByIdStargazers" ||
        query.endpointName === "getRepositoriesByIdIssues" ||
        query.endpointName === "getRepositoriesByIdPullRequests" ||
        query.endpointName === "getRepositoriesByIdCommits" ||
        query.endpointName === "getIssues" ||
        query.endpointName === "getIssuesSearch" ||
        query.endpointName === "getIssuesById" ||
        query.endpointName === "getPullRequests" ||
        query.endpointName === "getPullRequestsById" ||
        query.endpointName === "getPullRequestsByIdReviews" ||
        query.endpointName === "getCommitsById" ||
        query.endpointName === "getCommentsById"
      ) {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];

        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.subTeams != null) {
            for (let i0 = 0; i0 < item.subTeams.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.subTeams[i0],
                keyPath: [...[...keyPath, "subTeams"], i0],
              });
            }
          }
          if (item.parentTeam != null) {
            stack.push({
              item: item.parentTeam,
              keyPath: [...keyPath, "parentTeam"],
            });
          }
        }
      } else if (
        query.endpointName === "getUsersByIdTeams" ||
        query.endpointName === "getTeams"
      ) {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        for (let i0 = 0; i0 < query.data.length; i0++) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          stack.push({
            item: query.data[i0],
            keyPath: [...[queryCacheKey], i0],
          });
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.subTeams != null) {
            for (let i0 = 0; i0 < item.subTeams.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.subTeams[i0],
                keyPath: [...[...keyPath, "subTeams"], i0],
              });
            }
          }
          if (item.parentTeam != null) {
            stack.push({
              item: item.parentTeam,
              keyPath: [...keyPath, "parentTeam"],
            });
          }
        }
      } else if (query.endpointName === "getTeamsById") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        if (query.data.team != null) {
          stack.push({
            item: query.data.team,
            keyPath: [...[queryCacheKey], "team"],
          });
        }
        if (query.data.subTeams != null) {
          for (let i0 = 0; i0 < query.data.subTeams.length; i0++) {
            if (++counter % 1000 === 0) {
              const now = performance.now();
              if (now > deadline) {
                deadline = now + timeoutMs;
                timeoutMs = yield;
              }
            }
            stack.push({
              item: query.data.subTeams[i0],
              keyPath: [...[...[queryCacheKey], "subTeams"], i0],
            });
          }
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.subTeams != null) {
            for (let i0 = 0; i0 < item.subTeams.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.subTeams[i0],
                keyPath: [...[...keyPath, "subTeams"], i0],
              });
            }
          }
          if (item.parentTeam != null) {
            stack.push({
              item: item.parentTeam,
              keyPath: [...keyPath, "parentTeam"],
            });
          }
        }
      }
    } else if (typeName === "Issue") {
      if (
        query.endpointName === "getUsersByIdIssues" ||
        query.endpointName === "getRepositoriesByIdIssues" ||
        query.endpointName === "getIssues" ||
        query.endpointName === "getIssuesSearch"
      ) {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        for (let i0 = 0; i0 < query.data.length; i0++) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          stack.push({
            item: query.data[i0],
            keyPath: [...[queryCacheKey], i0],
          });
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
        }
      } else if (
        query.endpointName === "getUsersByIdPullRequests" ||
        query.endpointName === "getRepositoriesByIdPullRequests" ||
        query.endpointName === "getRepositoriesByIdCommits" ||
        query.endpointName === "getPullRequests" ||
        query.endpointName === "getPullRequestsById" ||
        query.endpointName === "getPullRequestsByIdReviews" ||
        query.endpointName === "getCommitsById"
      ) {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];

        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
        }
      } else if (query.endpointName === "getIssuesById") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        if (query.data.issue != null) {
          stack.push({
            item: query.data.issue,
            keyPath: [...[queryCacheKey], "issue"],
          });
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
        }
      }
    } else if (typeName === "Comment") {
      if (
        query.endpointName === "getUsersByIdIssues" ||
        query.endpointName === "getUsersByIdPullRequests" ||
        query.endpointName === "getRepositoriesByIdIssues" ||
        query.endpointName === "getRepositoriesByIdPullRequests" ||
        query.endpointName === "getRepositoriesByIdCommits" ||
        query.endpointName === "getIssues" ||
        query.endpointName === "getIssuesSearch" ||
        query.endpointName === "getPullRequests" ||
        query.endpointName === "getPullRequestsByIdReviews" ||
        query.endpointName === "getCommitsById"
      ) {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];

        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.replies != null) {
            for (let i0 = 0; i0 < item.replies.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.replies[i0],
                keyPath: [...[...keyPath, "replies"], i0],
              });
            }
          }
          if (item.parentComment != null) {
            stack.push({
              item: item.parentComment,
              keyPath: [...keyPath, "parentComment"],
            });
          }
        }
      } else if (
        query.endpointName === "getIssuesById" ||
        query.endpointName === "getPullRequestsById"
      ) {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        if (query.data.comments != null) {
          for (let i0 = 0; i0 < query.data.comments.length; i0++) {
            if (++counter % 1000 === 0) {
              const now = performance.now();
              if (now > deadline) {
                deadline = now + timeoutMs;
                timeoutMs = yield;
              }
            }
            stack.push({
              item: query.data.comments[i0],
              keyPath: [...[...[queryCacheKey], "comments"], i0],
            });
          }
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.replies != null) {
            for (let i0 = 0; i0 < item.replies.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.replies[i0],
                keyPath: [...[...keyPath, "replies"], i0],
              });
            }
          }
          if (item.parentComment != null) {
            stack.push({
              item: item.parentComment,
              keyPath: [...keyPath, "parentComment"],
            });
          }
        }
      } else if (query.endpointName === "getCommentsById") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        if (query.data.comment != null) {
          stack.push({
            item: query.data.comment,
            keyPath: [...[queryCacheKey], "comment"],
          });
        }
        if (query.data.replies != null) {
          for (let i0 = 0; i0 < query.data.replies.length; i0++) {
            if (++counter % 1000 === 0) {
              const now = performance.now();
              if (now > deadline) {
                deadline = now + timeoutMs;
                timeoutMs = yield;
              }
            }
            stack.push({
              item: query.data.replies[i0],
              keyPath: [...[...[queryCacheKey], "replies"], i0],
            });
          }
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.replies != null) {
            for (let i0 = 0; i0 < item.replies.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.replies[i0],
                keyPath: [...[...keyPath, "replies"], i0],
              });
            }
          }
          if (item.parentComment != null) {
            stack.push({
              item: item.parentComment,
              keyPath: [...keyPath, "parentComment"],
            });
          }
        }
      }
    } else if (typeName === "PullRequest") {
      if (
        query.endpointName === "getUsersByIdIssues" ||
        query.endpointName === "getRepositoriesByIdIssues" ||
        query.endpointName === "getRepositoriesByIdCommits" ||
        query.endpointName === "getIssues" ||
        query.endpointName === "getIssuesSearch" ||
        query.endpointName === "getPullRequestsByIdReviews"
      ) {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];

        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
        }
      } else if (
        query.endpointName === "getUsersByIdPullRequests" ||
        query.endpointName === "getRepositoriesByIdPullRequests" ||
        query.endpointName === "getPullRequests"
      ) {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        for (let i0 = 0; i0 < query.data.length; i0++) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          stack.push({
            item: query.data[i0],
            keyPath: [...[queryCacheKey], i0],
          });
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
        }
      } else if (query.endpointName === "getIssuesById") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        if (query.data.linkedPullRequests != null) {
          for (let i0 = 0; i0 < query.data.linkedPullRequests.length; i0++) {
            if (++counter % 1000 === 0) {
              const now = performance.now();
              if (now > deadline) {
                deadline = now + timeoutMs;
                timeoutMs = yield;
              }
            }
            stack.push({
              item: query.data.linkedPullRequests[i0],
              keyPath: [...[...[queryCacheKey], "linkedPullRequests"], i0],
            });
          }
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
        }
      } else if (
        query.endpointName === "getPullRequestsById" ||
        query.endpointName === "getCommitsById"
      ) {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        if (query.data.pullRequest != null) {
          stack.push({
            item: query.data.pullRequest,
            keyPath: [...[queryCacheKey], "pullRequest"],
          });
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
        }
      }
    } else if (typeName === "Commit") {
      if (
        query.endpointName === "getUsersByIdIssues" ||
        query.endpointName === "getUsersByIdPullRequests" ||
        query.endpointName === "getRepositoriesByIdIssues" ||
        query.endpointName === "getRepositoriesByIdPullRequests" ||
        query.endpointName === "getIssues" ||
        query.endpointName === "getIssuesSearch" ||
        query.endpointName === "getIssuesById" ||
        query.endpointName === "getPullRequests" ||
        query.endpointName === "getPullRequestsByIdReviews"
      ) {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];

        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
        }
      } else if (query.endpointName === "getRepositoriesByIdCommits") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        for (let i0 = 0; i0 < query.data.length; i0++) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          stack.push({
            item: query.data[i0],
            keyPath: [...[queryCacheKey], i0],
          });
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
        }
      } else if (query.endpointName === "getPullRequestsById") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        if (query.data.commits != null) {
          for (let i0 = 0; i0 < query.data.commits.length; i0++) {
            if (++counter % 1000 === 0) {
              const now = performance.now();
              if (now > deadline) {
                deadline = now + timeoutMs;
                timeoutMs = yield;
              }
            }
            stack.push({
              item: query.data.commits[i0],
              keyPath: [...[...[queryCacheKey], "commits"], i0],
            });
          }
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
        }
      } else if (query.endpointName === "getCommitsById") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        if (query.data.commit != null) {
          stack.push({
            item: query.data.commit,
            keyPath: [...[queryCacheKey], "commit"],
          });
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
        }
      }
    } else if (typeName === "ReviewThread") {
      if (query.endpointName === "getPullRequestsByIdReviews") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        for (let i0 = 0; i0 < query.data.length; i0++) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          stack.push({
            item: query.data[i0],
            keyPath: [...[queryCacheKey], i0],
          });
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
        }
      }
    }
  }
}
