module.exports = {
  testEnvironment: "node",

  transform: {
    "^.+\\.(t|j)sx?$": "babel-jest",
  },

  transformIgnorePatterns: ["/node_modules/(?!(msw|@mswjs|until-async)/)"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },

  setupFilesAfterEnv: ["<rootDir>/test/setupTests.ts"],
};
