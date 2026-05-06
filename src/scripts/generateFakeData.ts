import { faker } from "@faker-js/faker";
import * as fs from "fs";
import * as path from "path";

const DEFAULTS = {
  users: 1000,
  repos: 1000,
  teams: 1000,
  issues: 1000,
  prs: 1000,
  commits: 1000,
  comments: 1000,
  threads: 1000,
  out: "db.json",
};

function parseArgs() {
  const params = { ...DEFAULTS };
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: node -r esbuild-runner/register src/scripts/generateFakeData.ts [options]

Options:
  --users N      Users to generate (default ${DEFAULTS.users})
  --repos N      Repositories (default ${DEFAULTS.repos})
  --teams N      Teams (default ${DEFAULTS.teams})
  --issues N     Issues (default ${DEFAULTS.issues})
  --prs N        Pull requests (default ${DEFAULTS.prs})
  --commits N    Commits (default ${DEFAULTS.commits})
  --comments N   Comments (default ${DEFAULTS.comments})
  --threads N    Review threads (default ${DEFAULTS.threads})
  --out PATH     Output file (default ${DEFAULTS.out})

Serve the output with:
  npx json-server db.json --id _id --routes routes.json
    `);
    process.exit(0);
  }
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];
    if (!flag?.startsWith("--") || value == null) continue;
    const key = flag.slice(2) as keyof typeof params;
    if (key === "out") {
      params.out = value;
    } else if (key in params) {
      const n = parseInt(value, 10);
      if (!isNaN(n) && n >= 0) (params as Record<string, number | string>)[key] = n;
    }
  }
  return params;
}

function pick<T>(arr: T[], max: number): T[] {
  if (!arr.length || max === 0) return [];
  return faker.helpers.arrayElements(arr, { min: 0, max: Math.min(max, arr.length) });
}

function pickOne<T>(arr: T[]): T | undefined {
  return arr.length ? faker.helpers.arrayElement(arr) : undefined;
}

function id(prefix: string, i: number) {
  return `${prefix}-${String(i + 1).padStart(4, "0")}`;
}

// Stubs — minimal objects used for inline cross-references.
// Top-level entities are full objects; embedded references use stubs
// to prevent unbounded nesting.

interface UserStub {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
}

interface RepoStub {
  _id: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
}

interface TeamStub {
  _id: string;
  name: string;
  slug: string;
}

interface IssueStub {
  _id: string;
  title: string;
  state: "open" | "closed";
  number: number;
}

interface PRStub {
  _id: string;
  title: string;
  state: "open" | "closed" | "merged";
  number: number;
}

interface CommitStub {
  _id: string;
  hash: string;
  message: string;
}

interface CommentStub {
  _id: string;
  body: string;
  createdAt: string;
}

const LANGUAGES = ["TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "C#", "Ruby"];
const BRANCHES = ["main", "master", "develop"];

function buildUserStubs(count: number): UserStub[] {
  return Array.from({ length: count }, (_, i) => ({
    _id: id("user", i),
    username: faker.internet.username(),
    email: faker.internet.email(),
    displayName: faker.person.fullName(),
    avatar: faker.image.avatar(),
  }));
}

function buildRepoStubs(count: number, userStubs: UserStub[]): RepoStub[] {
  return Array.from({ length: count }, (_, i) => {
    const repoName = faker.helpers.slugify(
      `${faker.hacker.noun()}-${faker.hacker.noun()}`,
    ).toLowerCase();
    const owner = userStubs.length
      ? faker.helpers.arrayElement(userStubs).username
      : "anon";
    return {
      _id: id("repo", i),
      name: repoName,
      fullName: `${owner}/${repoName}`,
      description: faker.hacker.phrase(),
      language: faker.helpers.arrayElement(LANGUAGES),
    };
  });
}

function buildTeamStubs(count: number): TeamStub[] {
  return Array.from({ length: count }, (_, i) => {
    const name = `${faker.word.adjective()} ${faker.word.noun()} Team`;
    return {
      _id: id("team", i),
      name,
      slug: faker.helpers.slugify(name).toLowerCase(),
    };
  });
}

function buildIssueStubs(count: number): IssueStub[] {
  return Array.from({ length: count }, (_, i) => ({
    _id: id("issue", i),
    title: faker.hacker.phrase(),
    state: faker.helpers.arrayElement(["open", "closed"] as const),
    number: i + 1,
  }));
}

function buildPRStubs(count: number): PRStub[] {
  return Array.from({ length: count }, (_, i) => ({
    _id: id("pr", i),
    title: `${faker.hacker.ingverb()} ${faker.hacker.noun()}`,
    state: faker.helpers.arrayElement(["open", "closed", "merged"] as const),
    number: i + 1,
  }));
}

function buildCommitStubs(count: number): CommitStub[] {
  return Array.from({ length: count }, (_, i) => ({
    _id: id("commit", i),
    hash: faker.git.commitSha({ length: 7 }),
    message: faker.git.commitMessage(),
  }));
}

function buildCommentStubs(count: number): CommentStub[] {
  return Array.from({ length: count }, (_, i) => ({
    _id: id("comment", i),
    body: faker.lorem.sentences({ min: 1, max: 3 }),
    createdAt: faker.date.recent({ days: 180 }).toISOString(),
  }));
}

function buildUsers(stubs: UserStub[], repoStubs: RepoStub[], teamStubs: TeamStub[]) {
  return stubs.map(stub => ({
    ...stub,
    bio: faker.lorem.sentence(),
    createdAt: faker.date.past({ years: 5 }).toISOString(),
    followers: pick(stubs.filter(u => u._id !== stub._id), 5),
    following: pick(stubs.filter(u => u._id !== stub._id), 5),
    pinnedRepositories: pick(repoStubs, 3),
    starredRepositories: pick(repoStubs, 6),
    teams: pick(teamStubs, 3),
  }));
}

function buildRepositories(stubs: RepoStub[], userStubs: UserStub[]) {
  return stubs.map((stub, i) => ({
    ...stub,
    stars: faker.number.int({ min: 0, max: 50000 }),
    isPrivate: faker.datatype.boolean(),
    createdAt: faker.date.past({ years: 5 }).toISOString(),
    owner: pickOne(userStubs),
    collaborators: pick(userStubs, 5),
    stargazers: pick(userStubs, 10),
    // Use only earlier-indexed repos to keep forks/parentFork acyclic in the JSON
    forks: i > 0 ? pick(stubs.slice(0, i), 3) : [],
    parentFork: i > 0 && faker.datatype.boolean() ? stubs[faker.number.int({ min: 0, max: i - 1 })] : undefined,
  }));
}

function buildTeams(stubs: TeamStub[], userStubs: UserStub[], repoStubs: RepoStub[]) {
  return stubs.map((stub, i) => ({
    ...stub,
    description: faker.company.catchPhrase(),
    createdAt: faker.date.past({ years: 3 }).toISOString(),
    members: pick(userStubs, 8),
    repositories: pick(repoStubs, 4),
    subTeams: i > 0 ? pick(stubs.slice(0, i), 2) : [],
    parentTeam: i > 0 && faker.datatype.boolean() ? stubs[faker.number.int({ min: 0, max: i - 1 })] : undefined,
  }));
}

function buildIssues(stubs: IssueStub[], userStubs: UserStub[], repoStubs: RepoStub[], commentStubs: CommentStub[], prStubs: PRStub[]) {
  return stubs.map(stub => ({
    ...stub,
    body: faker.lorem.paragraphs({ min: 1, max: 3 }),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    closedAt: stub.state === "closed" ? faker.date.recent({ days: 60 }).toISOString() : undefined,
    author: pickOne(userStubs),
    assignees: pick(userStubs, 3),
    comments: pick(commentStubs, 5),
    linkedPullRequests: pick(prStubs, 2),
    repository: pickOne(repoStubs),
  }));
}

function buildPullRequests(stubs: PRStub[], userStubs: UserStub[], repoStubs: RepoStub[], commitStubs: CommitStub[], commentStubs: CommentStub[], issueStubs: IssueStub[]) {
  return stubs.map(stub => ({
    ...stub,
    body: faker.lorem.paragraph(),
    sourceBranch: faker.helpers.slugify(`feature/${faker.hacker.noun()}`).toLowerCase(),
    targetBranch: faker.helpers.arrayElement(BRANCHES),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    mergedAt: stub.state === "merged" ? faker.date.recent({ days: 90 }).toISOString() : undefined,
    author: pickOne(userStubs),
    reviewers: pick(userStubs, 3),
    commits: pick(commitStubs, 5),
    comments: pick(commentStubs, 5),
    resolvedIssues: pick(issueStubs, 2),
    repository: pickOne(repoStubs),
  }));
}

function buildCommits(stubs: CommitStub[], userStubs: UserStub[], prStubs: PRStub[]) {
  return stubs.map(stub => ({
    ...stub,
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    author: pickOne(userStubs),
    coAuthors: pick(userStubs, 2),
    pullRequest: faker.datatype.boolean() ? pickOne(prStubs) : undefined,
  }));
}

function buildComments(stubs: CommentStub[], userStubs: UserStub[]) {
  return stubs.map((stub, i) => ({
    ...stub,
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    author: pickOne(userStubs),
    // Use only earlier-indexed comments as replies to avoid circular refs
    replies: i > 0 ? pick(stubs.slice(0, i), 3) : [],
    parentComment: i > 0 && faker.datatype.boolean() ? stubs[faker.number.int({ min: 0, max: i - 1 })] : undefined,
  }));
}

function buildReviewThreads(count: number, userStubs: UserStub[], commentStubs: CommentStub[], prStubs: PRStub[]) {
  return Array.from({ length: count }, (_, i) => {
    const resolved = faker.datatype.boolean();
    return {
      _id: id("rt", i),
      filePath: faker.system.filePath(),
      line: faker.number.int({ min: 1, max: 500 }),
      isResolved: resolved,
      resolvedBy: resolved ? pickOne(userStubs) : undefined,
      comments: pick(commentStubs, 4),
      pullRequest: pickOne(prStubs),
    };
  });
}

function run() {
  const params = parseArgs();

  const userStubs = buildUserStubs(params.users as number);
  const repoStubs = buildRepoStubs(params.repos as number, userStubs);
  const teamStubs = buildTeamStubs(params.teams as number);
  const issueStubs = buildIssueStubs(params.issues as number);
  const prStubs = buildPRStubs(params.prs as number);
  const commitStubs = buildCommitStubs(params.commits as number);
  const commentStubs = buildCommentStubs(params.comments as number);

  const db = {
    users: buildUsers(userStubs, repoStubs, teamStubs),
    repositories: buildRepositories(repoStubs, userStubs),
    teams: buildTeams(teamStubs, userStubs, repoStubs),
    issues: buildIssues(issueStubs, userStubs, repoStubs, commentStubs, prStubs),
    pullRequests: buildPullRequests(prStubs, userStubs, repoStubs, commitStubs, commentStubs, issueStubs),
    commits: buildCommits(commitStubs, userStubs, prStubs),
    comments: buildComments(commentStubs, userStubs),
    reviewThreads: buildReviewThreads(params.threads as number, userStubs, commentStubs, prStubs),
  };

  const outPath = path.resolve(params.out as string);
  fs.writeFileSync(outPath, JSON.stringify(db, null, 2));

  const summary = Object.entries(db)
    .map(([k, v]) => `  ${k}: ${v.length}`)
    .join("\n");
  console.log(`Wrote ${outPath}\n${summary}`);
  console.log(`\nServe with: npx json-server ${params.out} --id _id --routes routes.json`);
}

run();