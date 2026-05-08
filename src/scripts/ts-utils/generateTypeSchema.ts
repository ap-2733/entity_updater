import ts from "typescript";
import * as fs from "node:fs";
import * as path from "node:path";
import * as prettier from "prettier";
import { loadFile } from "./loadFile";
import {
  collectEntityTypes,
  EntityInfo,
  findIdField,
} from "./collectEntityTypes";
import { findQueries } from "./findQueries";
import { findMutations } from "./findMutations";
import { isEntityType } from "./isEntityType";
import { getArrayElementType } from "./getArrayElementType";

type ShapeValue = string | Record<string, string>;

function isDomainEntity(checker: ts.TypeChecker, type: ts.Type): boolean {
  if (!isEntityType(checker, type)) return false;
  const declared = checker.getDeclaredTypeOfSymbol(type.aliasSymbol!);
  return (
    findIdField(checker, declared, type.aliasSymbol!.getName()) !== undefined
  );
}

function describeShape(
  checker: ts.TypeChecker,
  type: ts.Type,
): ShapeValue | null {
  if (type.isUnion()) {
    const nonUndef = type.types.filter(
      (t) => !(t.flags & ts.TypeFlags.Undefined),
    );
    if (nonUndef.length === 1) return describeShape(checker, nonUndef[0]);
    return null;
  }

  const elem = getArrayElementType(checker, type);
  if (elem) {
    if (isDomainEntity(checker, elem)) {
      return `${elem.aliasSymbol!.getName()}[]`;
    }
    return null;
  }

  if (isDomainEntity(checker, type)) {
    return type.aliasSymbol!.getName();
  }

  if (type.getFlags() & ts.TypeFlags.Object) {
    const objType = isEntityType(checker, type)
      ? checker.getDeclaredTypeOfSymbol(type.aliasSymbol!)
      : type;
    const fields: Record<string, string> = {};
    for (const prop of objType.getProperties()) {
      const decl = prop.valueDeclaration ?? prop.declarations?.[0];
      if (!decl) continue;
      const propType = checker.getTypeOfSymbolAtLocation(prop, decl);
      const shape = describeShape(checker, propType);
      if (shape !== null && typeof shape === "string") {
        fields[prop.getName()] = shape;
      }
    }
    if (Object.keys(fields).length > 0) return fields;
  }

  return null;
}

function serializeShape(shape: ShapeValue): string {
  if (typeof shape === "string") return `"${shape}"`;
  const entries = Object.entries(shape)
    .map(([k, v]) => `${k}: "${v}"`)
    .join(", ");
  return `{ ${entries} }`;
}

function canReachEntity(
  shape: ShapeValue,
  target: string,
  entityShapeMap: Map<string, Record<string, string>>,
  visited: Set<string>,
): boolean {
  if (typeof shape === "string") {
    if (shape === target || shape === `${target}[]`) return true;
    const base = shape.endsWith("[]") ? shape.slice(0, -2) : shape;
    if (visited.has(base)) return false;
    visited.add(base);
    const sub = entityShapeMap.get(base);
    return sub ? canReachEntity(sub, target, entityShapeMap, visited) : false;
  }
  return Object.values(shape).some((v) =>
    canReachEntity(v, target, entityShapeMap, visited),
  );
}

async function writeUnifiedFile(
  apiFilePath: string,
  outputFilePath: string,
): Promise<void> {
  const { checker, sourceFile } = loadFile(apiFilePath);

  const queryShapes = new Map<string, ShapeValue>();
  const mutationShapes = new Map<string, ShapeValue>();
  const allEntities = new Map<string, EntityInfo>();

  findQueries(sourceFile, (typeNode, queryName) => {
    const responseType = checker.getTypeFromTypeNode(typeNode);
    const entities = new Map<string, EntityInfo>();
    collectEntityTypes(checker, responseType, entities, new Set());

    const shape = describeShape(checker, responseType);
    if (shape !== null) queryShapes.set(queryName, shape);
    for (const [name, info] of entities) allEntities.set(name, info);
  });

  findMutations(sourceFile, (typeNode, mutationName) => {
    const responseType = checker.getTypeFromTypeNode(typeNode);
    const entities = new Map<string, EntityInfo>();
    collectEntityTypes(checker, responseType, entities, new Set());

    const shape = describeShape(checker, responseType);
    if (shape !== null) mutationShapes.set(mutationName, shape);
    for (const [name, info] of entities) allEntities.set(name, info);
  });

  if (!queryShapes.size) return;

  // Build entity sub-field shapes (reused for queryMap entries and entityQueries)
  const entityShapeMap = new Map<string, Record<string, string>>();
  for (const [entityName, info] of allEntities) {
    const declared = checker.getDeclaredTypeOfSymbol(info.type.aliasSymbol!);
    const fields: Record<string, string> = {};
    for (const prop of declared.getProperties()) {
      const decl = prop.valueDeclaration ?? prop.declarations?.[0];
      if (!decl) continue;
      const propType = checker.getTypeOfSymbolAtLocation(prop, decl);
      const shape = describeShape(checker, propType);
      if (shape !== null && typeof shape === "string") {
        fields[prop.getName()] = shape;
      }
    }
    if (Object.keys(fields).length > 0) entityShapeMap.set(entityName, fields);
  }

  // queryMap
  const queryMapLines: string[] = [];
  for (const [name, shape] of queryShapes) {
    queryMapLines.push(`  ${name}: ${serializeShape(shape)},`);
  }
  for (const [entityName, fields] of entityShapeMap) {
    const fieldStr = Object.entries(fields)
      .map(([k, v]) => `${k}: "${v}"`)
      .join(", ");
    queryMapLines.push(`  ${entityName}: { ${fieldStr} },`);
  }

  // mutationsMap - POST mutations are excluded (they create new entities, not update cached ones)
  const mutationsMapLines: string[] = [];
  for (const [name, shape] of mutationShapes) {
    if (name.startsWith("patch") || name.startsWith("put")) {
      mutationsMapLines.push(`  ${name}: ${serializeShape(shape)},`);
    }
  }

  // entityIdFields
  const idFieldLines: string[] = [];
  for (const [entityName, info] of allEntities) {
    idFieldLines.push(`  ${entityName}: "${info.idField}",`);
  }

  // entityQueries
  const entityQueriesLines: string[] = [];
  for (const entityName of allEntities.keys()) {
    const queries: string[] = [];
    for (const [queryName, queryShape] of queryShapes) {
      if (canReachEntity(queryShape, entityName, entityShapeMap, new Set())) {
        queries.push(queryName);
      }
    }
    const list = queries.map((q) => `"${q}"`).join(", ");
    entityQueriesLines.push(`  ${entityName}: [${list}],`);
  }

  const content =
    `/* eslint-disable @typescript-eslint/no-explicit-any */\n` +
    `import { Draft } from "immer";\n` +
    `import { createListenerMiddleware } from "@reduxjs/toolkit";\n` +
    `import { Api } from "@reduxjs/toolkit/query";\n` +
    `import { updateEntityInternal, deleteEntityInternal, setupMutationListenersInternal } from "./utils";\n\n` +
    `export const queryMap = {\n${queryMapLines.join("\n")}\n} as const;\n\n` +
    `export type QueryMap = typeof queryMap;\n\n` +
    `export const mutationsMap = {\n${mutationsMapLines.join("\n")}\n} as const;\n\n` +
    `export type MutationsMap = typeof mutationsMap;\n\n` +
    `export const entityIdFields = {\n${idFieldLines.join("\n")}\n} as const;\n\n` +
    `export type EntityIdFields = typeof entityIdFields;\n\n` +
    `export const entityQueries: Record<string, string[]> = {\n${entityQueriesLines.join("\n")}\n};\n\n` +
    `export function updateEntity(\n` +
    `  entityType: string,\n` +
    `  id: string | number,\n` +
    `  updater: (entity: Draft<any>) => void,\n` +
    `) {\n` +
    `  return updateEntityInternal(entityType, id, updater, "api", entityIdFields, queryMap, entityQueries);\n` +
    `}\n\n` +
    `export function deleteEntity(entityType: string, id: string | number) {\n` +
    `  return deleteEntityInternal(entityType, id, "api", entityIdFields, queryMap, entityQueries);\n` +
    `}\n\n` +
    `export function setupMutationListeners(\n` +
    `  listenerMiddleware: ReturnType<typeof createListenerMiddleware>,\n` +
    `  api: Api<any, any, any, any, any>,\n` +
    `) {\n` +
    `  setupMutationListenersInternal(listenerMiddleware, api, entityIdFields, mutationsMap, api.reducerPath, queryMap, entityQueries,);\n` +
    `}\n`;

  fs.writeFileSync(
    outputFilePath,
    await prettier.format(content, { filepath: outputFilePath }),
  );

  const outputDir = path.dirname(path.resolve(outputFilePath));
  const utilsSrc = path.resolve(__dirname, "./utils.ts");
  fs.copyFileSync(utilsSrc, path.join(outputDir, "utils.ts"));
}

export async function generateTypeSchema(
  apiFilePath: string,
  outputFilePath: string,
): Promise<void> {
  await writeUnifiedFile(apiFilePath, outputFilePath);
}
