import ts from "typescript";

export function findMutations(
  node: ts.Node,
  callback: (node: ts.TypeNode, mutationName: string) => void,
) {
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === "mutation"
  ) {
    const parent = node.parent;

    if (
      parent &&
      ts.isPropertyAssignment(parent) &&
      ts.isIdentifier(parent.name)
    ) {
      const mutationName = parent.name.text;

      if (node.typeArguments && node.typeArguments.length > 0) {
        callback(node.typeArguments[0], mutationName);
      }
    }
  }

  ts.forEachChild(node, (child) => findMutations(child, callback));
}