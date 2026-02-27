import ts from "typescript";
import { getArrayElementType } from "./getArrayElementType";
import { isEntityType } from "./isEntityType";

export function visitTypes(
  checker: ts.TypeChecker,
  type: ts.Type,
  queryName: string,
  path: string[],
  callback: (typeName: string, queryName: string, path: string[]) => void,
) {
  if (type.isUnion()) {
    for (const subType of type.types) {
      visitTypes(checker, subType, queryName, path, callback);
    }
    return;
  }

  const elementType = getArrayElementType(checker, type);
  if (elementType) {
    visitTypes(checker, elementType, queryName, [...path, "[]"], callback);
    return;
  }

  const typeName = type.aliasSymbol?.getName();

  if (typeName && isEntityType(checker, type)) {
    callback(typeName, queryName, path);
  }

  if ((type.getFlags() & ts.TypeFlags.Object) !== 0) {
    for (const prop of type.getProperties()) {
      const decl = prop.valueDeclaration ?? prop.declarations?.[0];

      if (!decl) {
        continue;
      }

      const propType = checker.getTypeOfSymbolAtLocation(prop, decl);

      visitTypes(
        checker,
        propType,
        queryName,
        [...path, prop.getName()],
        callback,
      );
    }
  }
}
