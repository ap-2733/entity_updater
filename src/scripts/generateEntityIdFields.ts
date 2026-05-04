import * as fs from "node:fs";
import * as prettier from "prettier";
import { loadFile } from "./loadFile";
import { collectEntityTypes } from "./collectEntityTypes";
import { findQueries } from "./findQueries";

async function writeEntityIdFieldsFile(
  apiFilePath: string,
  outputFilePath: string,
): Promise<void> {
  const { checker, sourceFile } = loadFile(apiFilePath);
  const entities = new Map<string, string>();

  findQueries(sourceFile, (typeNode) => {
    const responseType = checker.getTypeFromTypeNode(typeNode);
    const found = new Map();
    collectEntityTypes(checker, responseType, found, new Set());
    for (const [name, info] of found) {
      entities.set(name, info.idField);
    }
  });

  if (!entities.size) return;

  const entries = Array.from(entities.entries())
    .map(([name, field]) => `  ${name}: "${field}",`)
    .join("\n");

  const content =
    `export const entityIdFields = {\n${entries}\n} as const;\n\n` +
    `export type EntityIdFields = typeof entityIdFields;\n`;

  fs.writeFileSync(
    outputFilePath,
    await prettier.format(content, { filepath: outputFilePath }),
  );
}

export async function generateEntityIdFields(
  apiFilePath: string,
  outputFilePath: string,
): Promise<void> {
  await writeEntityIdFieldsFile(apiFilePath, outputFilePath);
}