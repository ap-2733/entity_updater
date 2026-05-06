import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import {
  user1,
  user2,
  user3,
  comment1,
  comment2,
  issue1,
  issue2,
  pr1,
  pr2,
  repo1,
  repo2,
  repo3,
  reviewThread1,
  reviewThread2,
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
  http.patch("http://localhost:3000/api/users/:id", async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const user = [user1, user2, user3].find((u) => u._id === params.id);
    if (!user) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...user, ...body, _id: user._id });
  }),
  http.patch("http://localhost:3000/api/repositories/:id", async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const repo = [repo1, repo2, repo3].find((r) => r._id === params.id);
    if (!repo) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...repo, ...body, _id: repo._id });
  }),
  http.put("http://localhost:3000/api/issues/:id", async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const issue = [issue1, issue2].find((i) => i._id === params.id);
    if (!issue) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...body, _id: issue._id });
  }),
  http.patch("http://localhost:3000/api/issues/:id", async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const issue = [issue1, issue2].find((i) => i._id === params.id);
    if (!issue) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...issue, ...body, _id: issue._id });
  }),
  http.put("http://localhost:3000/api/pullRequests/:id", async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const pr = [pr1, pr2].find((p) => p._id === params.id);
    if (!pr) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...body, _id: pr._id });
  }),
  http.patch("http://localhost:3000/api/pullRequests/:id", async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const pr = [pr1, pr2].find((p) => p._id === params.id);
    if (!pr) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...pr, ...body, _id: pr._id });
  }),
);