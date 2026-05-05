/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";

const app = express();
app.use(express.json());

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

const dbPath = path.resolve("db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

function paginate<T>(arr: T[], skip?: string, limit?: string): T[] {
  const s = skip ? parseInt(skip, 10) : 0;
  const l = limit ? parseInt(limit, 10) : arr.length;
  return arr.slice(s, s + l);
}

// Users
app.get("/api/users", (req: Request, res: Response) => {
  const { skip, limit } = req.query as Record<string, string>;
  res.json(paginate(db.users, skip, limit));
});

app.get("/api/users/search", (req: Request, res: Response) => {
  const { q } = req.query as Record<string, string>;
  if (!q) return res.json(db.users);
  const lower = q.toLowerCase();
  res.json(
    db.users.filter(
      (u: any) =>
        u.username?.toLowerCase().includes(lower) ||
        u.displayName?.toLowerCase().includes(lower),
    ),
  );
});

app.get("/api/users/:id", (req: Request, res: Response) => {
  const user = db.users.find((u: any) => u._id === req.params.id);
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json({ user, followers: user.followers ?? [], following: user.following ?? [] });
});

app.get("/api/users/:id/repositories", (req: Request, res: Response) => {
  res.json(db.repositories.filter((r: any) => r.owner?._id === req.params.id));
});

app.get("/api/users/:id/teams", (req: Request, res: Response) => {
  res.json(
    db.teams.filter((t: any) =>
      t.members?.some((m: any) => m._id === req.params.id),
    ),
  );
});

app.get("/api/users/:id/issues", (req: Request, res: Response) => {
  const { state } = req.query as Record<string, string>;
  let results = db.issues.filter((i: any) => i.author?._id === req.params.id);
  if (state && state !== "all") results = results.filter((i: any) => i.state === state);
  res.json(results);
});

app.get("/api/users/:id/pullRequests", (req: Request, res: Response) => {
  const { state } = req.query as Record<string, string>;
  let results = db.pullRequests.filter((p: any) => p.author?._id === req.params.id);
  if (state && state !== "all") results = results.filter((p: any) => p.state === state);
  res.json(results);
});

// Repositories
app.get("/api/repositories", (req: Request, res: Response) => {
  const { skip, limit } = req.query as Record<string, string>;
  res.json(paginate(db.repositories, skip, limit));
});

app.get("/api/repositories/search", (req: Request, res: Response) => {
  const { q, language } = req.query as Record<string, string>;
  let results = db.repositories;
  if (q) {
    const lower = q.toLowerCase();
    results = results.filter(
      (r: any) =>
        r.name?.toLowerCase().includes(lower) ||
        r.description?.toLowerCase().includes(lower),
    );
  }
  if (language) {
    results = results.filter(
      (r: any) => r.language?.toLowerCase() === language.toLowerCase(),
    );
  }
  res.json(results);
});

app.get("/api/repositories/:id", (req: Request, res: Response) => {
  const repo = db.repositories.find((r: any) => r._id === req.params.id);
  if (!repo) return res.status(404).json({ error: "Not found" });
  res.json({
    repository: repo,
    collaborators: repo.collaborators ?? [],
    forks: repo.forks ?? [],
  });
});

app.get("/api/repositories/:id/stargazers", (req: Request, res: Response) => {
  const repo = db.repositories.find((r: any) => r._id === req.params.id);
  if (!repo) return res.status(404).json({ error: "Not found" });
  res.json(repo.stargazers ?? []);
});

app.get("/api/repositories/:id/issues", (req: Request, res: Response) => {
  const { state } = req.query as Record<string, string>;
  let results = db.issues.filter((i: any) => i.repository?._id === req.params.id);
  if (state && state !== "all") results = results.filter((i: any) => i.state === state);
  res.json(results);
});

app.get("/api/repositories/:id/pullRequests", (req: Request, res: Response) => {
  const { state } = req.query as Record<string, string>;
  let results = db.pullRequests.filter((p: any) => p.repository?._id === req.params.id);
  if (state && state !== "all") results = results.filter((p: any) => p.state === state);
  res.json(results);
});

app.get("/api/repositories/:id/commits", (req: Request, res: Response) => {
  const repoPrs = db.pullRequests.filter(
    (p: any) => p.repository?._id === req.params.id,
  );
  const commitIds = new Set(
    repoPrs.flatMap((p: any) => p.commits?.map((c: any) => c._id) ?? []),
  );
  res.json(db.commits.filter((c: any) => commitIds.has(c._id)));
});

// Issues
app.get("/api/issues", (req: Request, res: Response) => {
  const { skip, limit } = req.query as Record<string, string>;
  res.json(paginate(db.issues, skip, limit));
});

app.get("/api/issues/search", (req: Request, res: Response) => {
  const { q, state } = req.query as Record<string, string>;
  let results = db.issues;
  if (q) {
    const lower = q.toLowerCase();
    results = results.filter(
      (i: any) =>
        i.title?.toLowerCase().includes(lower) ||
        i.body?.toLowerCase().includes(lower),
    );
  }
  if (state && state !== "all") results = results.filter((i: any) => i.state === state);
  res.json(results);
});

app.get("/api/issues/:id", (req: Request, res: Response) => {
  const issue = db.issues.find((i: any) => i._id === req.params.id);
  if (!issue) return res.status(404).json({ error: "Not found" });
  res.json({
    issue,
    comments: issue.comments ?? [],
    linkedPullRequests: issue.linkedPullRequests ?? [],
  });
});

app.post("/api/issues/:id/comments", (req: Request, res: Response) => {
  const issue = db.issues.find((i: any) => i._id === req.params.id);
  if (!issue) return res.status(404).json({ error: "Not found" });
  const comment = {
    _id: `comment-${Date.now()}`,
    body: req.body.body,
    createdAt: new Date().toISOString(),
  };
  issue.comments = [...(issue.comments ?? []), comment];
  res.status(201).json(comment);
});

// Pull Requests
app.get("/api/pullRequests", (req: Request, res: Response) => {
  const { skip, limit } = req.query as Record<string, string>;
  res.json(paginate(db.pullRequests, skip, limit));
});

app.get("/api/pullRequests/:id", (req: Request, res: Response) => {
  const pr = db.pullRequests.find((p: any) => p._id === req.params.id);
  if (!pr) return res.status(404).json({ error: "Not found" });
  res.json({ pullRequest: pr, commits: pr.commits ?? [], comments: pr.comments ?? [] });
});

app.get("/api/pullRequests/:id/reviews", (req: Request, res: Response) => {
  res.json(
    db.reviewThreads.filter((rt: any) => rt.pullRequest?._id === req.params.id),
  );
});

app.post("/api/pullRequests/:id/comments", (req: Request, res: Response) => {
  const pr = db.pullRequests.find((p: any) => p._id === req.params.id);
  if (!pr) return res.status(404).json({ error: "Not found" });
  const comment = {
    _id: `comment-${Date.now()}`,
    body: req.body.body,
    createdAt: new Date().toISOString(),
  };
  pr.comments = [...(pr.comments ?? []), comment];
  res.status(201).json(comment);
});

// Teams
app.get("/api/teams", (_req: Request, res: Response) => {
  res.json(db.teams);
});

app.get("/api/teams/:id", (req: Request, res: Response) => {
  const team = db.teams.find((t: any) => t._id === req.params.id);
  if (!team) return res.status(404).json({ error: "Not found" });
  res.json({
    team,
    members: team.members ?? [],
    subTeams: team.subTeams ?? [],
    repositories: team.repositories ?? [],
  });
});

// Commits
app.get("/api/commits/:id", (req: Request, res: Response) => {
  const commit = db.commits.find((c: any) => c._id === req.params.id);
  if (!commit) return res.status(404).json({ error: "Not found" });
  const pr = db.pullRequests.find((p: any) =>
    p.commits?.some((c: any) => c._id === req.params.id),
  );
  res.json({
    commit,
    coAuthors: commit.coAuthors ?? [],
    pullRequest: pr
      ? { _id: pr._id, title: pr.title, state: pr.state, number: pr.number }
      : undefined,
  });
});

// Comments
app.get("/api/comments/:id", (req: Request, res: Response) => {
  const comment = db.comments.find((c: any) => c._id === req.params.id);
  if (!comment) return res.status(404).json({ error: "Not found" });
  res.json({ comment, replies: comment.replies ?? [] });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}/api`);
  console.log(`  db: ${dbPath}`);
});