import ts from "typescript";
import * as fs from "node:fs";
import * as prettier from "prettier";
import { loadFile } from "./loadFile";
import { collectEntityTypes, EntityInfo } from "./collectEntityTypes";

async function writeUpdateEntityFile(
  apiFilePath: string,
  outputFilePath: string,
): Promise<void> {
  const { checker, sourceFile } = loadFile(apiFilePath);
  const entities = new Map<string, EntityInfo>();

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "query" &&
      node.typeArguments?.length
    ) {
      const responseType = checker.getTypeFromTypeNode(node.typeArguments[0]);
      collectEntityTypes(checker, responseType, entities, new Set());
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!entities.size) return;

  const entityList = Array.from(entities.values());
  const typeImports = entityList.map((e) => e.name).join(", ");

  const overloads = entityList
    .map(
      (info) =>
        `export function updateEntity(payload: {\n` +
        `  typeName: "${info.name}";\n` +
        `  id: string;\n` +
        `  update: (draft: ${info.name}) => void;\n` +
        `}): ReturnType<typeof updateEntityInternal>;`,
    )
    .join("\n\n");

  const content =
    `/* eslint-disable @typescript-eslint/no-explicit-any */\n` +
    `import type { ${typeImports} } from "./productApi";\n` +
    `import { updateEntityInternal } from "./updateEntityInternal";\n\n` +
    `${overloads}\n\n` +
    `export function updateEntity(payload: {\n` +
    `  typeName: string;\n` +
    `  id: string;\n` +
    `  update: (draft: any) => void;\n` +
    `}) {\n` +
    `  return updateEntityInternal(payload);\n` +
    `}\n`;

  fs.writeFileSync(
    outputFilePath,
    await prettier.format(content, { filepath: outputFilePath }),
  );
}

export async function generateUpdateEntity(
  apiFilePath: string,
  outputFilePath: string,
): Promise<void> {
  await writeUpdateEntityFile(apiFilePath, outputFilePath);
}