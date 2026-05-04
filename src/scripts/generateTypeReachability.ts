import ts from "typescript";
import * as fs from "node:fs";
import * as prettier from "prettier";
import { loadFile } from "./loadFile";
import { collectEntityTypes, EntityInfo, findIdField } from "./collectEntityTypes";
import { findQueries } from "./findQueries";
import { isEntityType } from "./isEntityType";
import { getArrayElementType } from "./getArrayElementType";

type ShapeValue = string | Record<string, string>;

function isDomainEntity(checker: ts.TypeChecker, type: ts.Type): boolean {
  if (!isEntityType(checker, type)) return false;
  const declared = checker.getDeclaredTypeOfSymbol(type.aliasSymbol!);
  return findIdField(checker, declared, type.aliasSymbol!.getName()) !== undefined;
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

async function writeQueryMapFile(
  apiFilePath: string,
  outputFilePath: string,
): Promise<void> {
  const { checker, sourceFile } = loadFile(apiFilePath);

  const queryShapes = new Map<string, ShapeValue>();
  const allEntities = new Map<string, EntityInfo>();

  findQueries(sourceFile, (typeNode, queryName) => {
    const responseType = checker.getTypeFromTypeNode(typeNode);
    const entities = new Map<string, EntityInfo>();
    collectEntityTypes(checker, responseType, entities, new Set());

    const shape = describeShape(checker, responseType);
    if (shape !== null) {
      queryShapes.set(queryName, shape);
    }

    for (const [name, info] of entities) {
      allEntities.set(name, info);
    }
  });

  if (!queryShapes.size) return;

  const lines: string[] = [];

  for (const [name, shape] of queryShapes) {
    lines.push(`  ${name}: ${serializeShape(shape)},`);
  }

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
    if (Object.keys(fields).length > 0) {
      const fieldStr = Object.entries(fields)
        .map(([k, v]) => `${k}: "${v}"`)
        .join(", ");
      lines.push(`  ${entityName}: { ${fieldStr} },`);
    }
  }

  const content =
    `export const queryMap = {\n${lines.join("\n")}\n} as const;\n\n` +
    `export type QueryMap = typeof queryMap;\n`;

  fs.writeFileSync(
    outputFilePath,
    await prettier.format(content, { filepath: outputFilePath }),
  );
}

export async function generateTypeReachability(
  apiFilePath: string,
  outputFilePath: string,
): Promise<void> {
  await writeQueryMapFile(apiFilePath, outputFilePath);
}