import ts from "typescript";

export function isEntityType(checker: ts.TypeChecker, type: ts.Type): boolean {
  if (!type.aliasSymbol) {
    return false;
  }

  const aliased = checker.getDeclaredTypeOfSymbol(type.aliasSymbol);

  if (!(aliased.flags & ts.TypeFlags.Object)) {
    return false;
  }

  if (checker.isArrayType(aliased)) {
    return false;
  }

  const props = checker.getPropertiesOfType(aliased);

  return props.length !== 0;
}
