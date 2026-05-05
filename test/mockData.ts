export const user1 = {
  _id: "user001",
  username: "alice",
  email: "alice@example.com",
  displayName: "Alice",
};

export const user2 = {
  _id: "user002",
  username: "bob",
  email: "bob@example.com",
  displayName: "Bob",
  followers: [user1],
};

export const user3 = {
  _id: "user003",
  username: "carol",
  email: "carol@example.com",
  displayName: "Carol",
};

export const repo1 = {
  _id: "repo001",
  name: "awesome-project",
  fullName: "alice/awesome-project",
};

export const repo2 = {
  _id: "repo002",
  name: "forked-project",
  fullName: "bob/forked-project",
  parentFork: repo1,
};

export const repo3 = {
  _id: "repo003",
  name: "another-project",
  fullName: "carol/another-project",
};

export const team1 = {
  _id: "team001",
  name: "Core Team",
  slug: "core-team",
};

export const team2 = {
  _id: "team002",
  name: "Frontend Team",
  slug: "frontend-team",
  subTeams: [team1],
};

export const issue1 = {
  _id: "issue001",
  title: "Fix login bug",
  state: "open" as const,
};

export const issue2 = {
  _id: "issue002",
  title: "Update documentation",
  state: "closed" as const,
};

export const comment1 = {
  _id: "comment001",
  body: "This looks great!",
};

export const comment2 = {
  _id: "comment002",
  body: "I agree.",
};

export const commentWithReply = {
  _id: "comment003",
  body: "Needs another look.",
  replies: [comment1],
};

export const pr1 = {
  _id: "pr001",
  title: "Add user authentication",
  state: "open" as const,
};

export const pr2 = {
  _id: "pr002",
  title: "Fix typos in README",
  state: "merged" as const,
};

export const commit1 = {
  _id: "commit001",
  hash: "abc1234",
  message: "Initial commit",
};

export const commit2 = {
  _id: "commit002",
  hash: "def5678",
  message: "Add tests",
};

export const reviewThread1 = {
  _id: "rt001",
  filePath: "src/auth.ts",
  line: 42,
  isResolved: false,
};

export const reviewThread2 = {
  _id: "rt002",
  filePath: "src/index.ts",
  line: 10,
  isResolved: true,
};