import ts from "typescript";
import * as fs from "node:fs";
import * as prettier from "prettier";
import { loadFile } from "./loadFile";
import { collectEntityTypes, EntityInfo } from "./collectEntityTypes";
import { findQueries } from "./findQueries";
import { generateWalk } from "./generateEntityListeners";

const LOOP_GUARD =
  "if (++counter % 1000 === 0) { const now = performance.now(); if (now > deadline) { deadline = now + timeoutMs; timeoutMs = yield; } }";

async function writeWalkEntityTypeFile(
  apiFilePath: string,
  outputFilePath: string,
): Promise<void> {
  const { checker, sourceFile } = loadFile(apiFilePath);

  const queryData = new Map<
    string,
    { responseType: ts.Type; entities: Map<string, EntityInfo> }
  >();

  findQueries(sourceFile, (typeNode, queryName) => {
    const responseType = checker.getTypeFromTypeNode(typeNode);
    const entities = new Map<string, EntityInfo>();
    collectEntityTypes(checker, responseType, entities, new Set());
    if (entities.size > 0) {
      queryData.set(queryName, { responseType, entities });
    }
  });

  if (!queryData.size) return;

  // entity name → ordered list of query names that contain it
  const entityToQueries = new Map<string, string[]>();
  const allEntities = new Map<string, EntityInfo>();

  for (const [queryName, { entities }] of queryData) {
    for (const [name, info] of entities) {
      if (!entityToQueries.has(name)) entityToQueries.set(name, []);
      entityToQueries.get(name)!.push(queryName);
      allEntities.set(name, info);
    }
  }

  // Generates the inner code for one (targetType, queryName) block:
  // a stack-based loop that pushes only targetType instances (seed from response
  // root + nested instances discovered while processing each entry).
  function buildQueryBlock(targetType: string, queryName: string): string {
    const { responseType, entities } = queryData.get(queryName)!;

    const onEntityPush = (name: string, expr: string, kp: string) =>
      name === targetType ? `stack.push({ item: ${expr}, keyPath: ${kp} });` : "";

    // Seed: walk response root, push only targetType instances.
    // Passing the full entities map ensures other entity types act as stop nodes
    // rather than being recursed into, which prevents infinite generation loops.
    const seed = generateWalk(
      checker,
      responseType,
      "query.data",
      "[queryCacheKey]",
      0,
      entities,
      onEntityPush,
      LOOP_GUARD,
    );

    // Loop body: call callback then push any nested targetType instances from
    // the current entry's properties.
    const targetInfo = allEntities.get(targetType)!;
    const declared = checker.getDeclaredTypeOfSymbol(targetInfo.type.aliasSymbol!);
    const propPushes = declared
      .getProperties()
      .map((prop) => {
        const decl = prop.valueDeclaration ?? prop.declarations?.[0];
        if (!decl) return "";
        return generateWalk(
          checker,
          checker.getTypeOfSymbolAtLocation(prop, decl),
          `item.${prop.getName()}`,
          `[...keyPath, "${prop.getName()}"]`,
          0,
          entities,
          onEntityPush,
          LOOP_GUARD,
        );
      })
      .filter(Boolean);

    return (
      `const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];\n` +
      seed +
      "\n" +
      `let stackIdx = 0;\n` +
      `while (stackIdx < stack.length) {\n` +
      `${LOOP_GUARD}\n` +
      `const { item, keyPath } = stack[stackIdx++];\n` +
      `if (item[idField] === id) callback(item, keyPath);\n` +
      propPushes.join("\n") +
      "\n}"
    );
  }

  // Generates the if/else-if chain for one targetType.
  // Queries with identical generated code are merged into a single `||` condition.
  function buildTypeBranch(targetType: string, queries: string[]): string {
    const codeToQueries = new Map<string, string[]>();
    for (const queryName of queries) {
      const code = buildQueryBlock(targetType, queryName);
      if (!codeToQueries.has(code)) codeToQueries.set(code, []);
      codeToQueries.get(code)!.push(queryName);
    }

    return Array.from(codeToQueries.entries())
      .map(([code, qs], i) => {
        const condition = qs
          .map((q) => `query.endpointName === "${q}"`)
          .join(" || ");
        return `${i === 0 ? "if" : "else if"} (${condition}) {\n${code}\n}`;
      })
      .join("\n");
  }

  const entityNames = Array.from(entityToQueries.keys());

  const typeBranches = entityNames
    .map((targetType, i) => {
      const inner = buildTypeBranch(targetType, entityToQueries.get(targetType)!);
      return `${i === 0 ? "if" : "else if"} (typeName === "${targetType}") {\n${inner}\n}`;
    })
    .join("\n");

  const typeUnion = entityNames.map((n) => `"${n}"`).join(" | ");

  const content =
    `/* eslint-disable @typescript-eslint/no-explicit-any */\n` +
    `import { entityIdFields } from "./entityIdFields";\n\n` +
    `export function* walkEntityType(\n` +
    `  typeName: ${typeUnion},\n` +
    `  id: string,\n` +
    `  queries: Record<string, { endpointName: string; data: any }>,\n` +
    `  callback: (item: any, keyPath: (string | number)[]) => void,\n` +
    `  timeoutMs: number,\n` +
    `): Generator<void> {\n` +
    `const idField = entityIdFields[typeName];\n` +
    `let deadline = performance.now() + timeoutMs;\n` +
    `let counter = 0;\n` +
    `for (const [queryCacheKey, query] of Object.entries(queries)) {\n` +
    `${LOOP_GUARD}\n` +
    `if (!query.data) continue;\n` +
    typeBranches +
    "\n}\n}\n";

  fs.writeFileSync(
    outputFilePath,
    await prettier.format(content, { filepath: outputFilePath }),
  );
}

export async function generateWalkEntityType(
  apiFilePath: string,
  outputFilePath: string,
): Promise<void> {
  await writeWalkEntityTypeFile(apiFilePath, outputFilePath);
}