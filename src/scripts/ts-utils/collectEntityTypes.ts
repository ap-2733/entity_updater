import ts from "typescript";
import { isEntityType } from "./isEntityType";
import { getArrayElementType } from "./getArrayElementType";

function normalizeFieldName(name: string): string {
  return name.replace(/[^a-z]/gi, "").toLowerCase();
}

export function findIdField(
  checker: ts.TypeChecker,
  type: ts.Type,
  typeName: string,
): string | undefined {
  let exact: string | undefined;
  let suffix: string | undefined;
  const ownIdSuffix = typeName.toLowerCase() + "id";
  for (const prop of checker.getPropertiesOfType(type)) {
    const norm = normalizeFieldName(prop.getName());
    if (norm === "id") {
      exact ??= prop.getName();
    } else if (norm === ownIdSuffix) {
      suffix ??= prop.getName();
    }
  }
  return exact ?? suffix;
}

export interface EntityInfo {
  name: string;
  type: ts.Type;
  idField: string;
}

export function collectEntityTypes(
  checker: ts.TypeChecker,
  type: ts.Type,
  result: Map<string, EntityInfo>,
  seenNames: Set<string>,
): void {
  if (type.isUnion()) {
    for (const t of type.types) {
      collectEntityTypes(checker, t, result, seenNames);
    }
    return;
  }
  const elem = getArrayElementType(checker, type);
  if (elem) {
    collectEntityTypes(checker, elem, result, seenNames);
    return;
  }
  if (isEntityType(checker, type)) {
    const name = type.aliasSymbol!.getName();
    if (seenNames.has(name)) {
      return;
    }
    seenNames.add(name);
    const declared = checker.getDeclaredTypeOfSymbol(type.aliasSymbol!);
    const idField = findIdField(checker, declared, name);
    if (idField) {
      result.set(name, { name, type, idField });
    }
    for (const prop of declared.getProperties()) {
      const decl = prop.valueDeclaration ?? prop.declarations?.[0];
      if (decl) {
        collectEntityTypes(checker, checker.getTypeOfSymbolAtLocation(prop, decl), result, seenNames);
      }
    }
    return;
  }
  if (type.getFlags() & ts.TypeFlags.Object) {
    for (const prop of type.getProperties()) {
      const decl = prop.valueDeclaration ?? prop.declarations?.[0];
      if (decl) {
        collectEntityTypes(checker, checker.getTypeOfSymbolAtLocation(prop, decl), result, seenNames);
      }
    }
  }
}