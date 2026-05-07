import ts from "typescript";

export function getArrayElementType(
  checker: ts.TypeChecker,
  type: ts.Type,
): ts.Type | null {
  if (checker.isArrayType(type)) {
    const ref = type as ts.TypeReference;
    return ref.typeArguments?.[0] ?? null;
  }

  return null;
}
