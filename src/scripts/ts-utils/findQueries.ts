import ts from "typescript";

export function findQueries(
  node: ts.Node,
  callback: (node: ts.TypeNode, queryName: string, keyPath: string[]) => void,
) {
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === "query"
  ) {
    const parent = node.parent;

    if (
      parent &&
      ts.isPropertyAssignment(parent) &&
      ts.isIdentifier(parent.name)
    ) {
      const queryName = parent.name.text;

      if (node.typeArguments && node.typeArguments.length > 0) {
        callback(node.typeArguments[0], queryName, []);
      }
    }
  }

  ts.forEachChild(node, (child) => findQueries(child, callback));
}
