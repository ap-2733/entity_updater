import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import {
  user1,
  user2,
  user3,
  comment1,
  comment2,
  issue1,
  reviewThread1,
  reviewThread2,
  repo2,
} from "@/test/mockData";

export const server = setupServer(
  http.get("http://localhost:3000/api/users", () => {
    return HttpResponse.json([user1, user2, user3]);
  }),
  http.get("http://localhost:3000/api/users/search", () => {
    return HttpResponse.json([user1]);
  }),
  http.get("http://localhost:3000/api/users/user001", () => {
    return HttpResponse.json({ user: user1, followers: [], following: [] });
  }),
  http.get("http://localhost:3000/api/issues/issue001", () => {
    return HttpResponse.json({
      issue: issue1,
      comments: [comment1, comment2],
      linkedPullRequests: [],
    });
  }),
  http.get("http://localhost:3000/api/pullRequests/pr001/reviews", () => {
    return HttpResponse.json([reviewThread1, reviewThread2]);
  }),
  http.get("http://localhost:3000/api/repositories/repo002", () => {
    return HttpResponse.json({ repository: repo2, collaborators: [], forks: [] });
  }),
);