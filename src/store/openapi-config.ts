import type { ConfigFile } from "@rtk-query/codegen-openapi";

const config: ConfigFile = {
  schemaFile: "./schema.json",
  apiFile: "./emptyApi.ts",
  apiImport: "emptySplitApi",
  outputFile: "./productApi.ts",
  exportName: "productApi",
  hooks: true,
};

export default config;
