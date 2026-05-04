/**
 * Generates src/store/entityListeners.ts — a file that wires RTK listener
 * middleware to every RTK Query endpoint so that each fulfilled query
 * automatically dispatches an `entityLoaded` action for every entity instance
 * found in the response payload.
 *
 * Pipeline overview
 * -----------------
 * 1. Open productApi.ts with a TypeScript program so we have a full type
 *    checker (not just a syntax tree).
 * 2. Walk the AST to find every `build.query<ResponseType, ArgType>({...})`
 *    call expression.  The endpoint name comes from the surrounding
 *    PropertyAssignment, and the response type is the first type argument.
 * 3. For each response type, run collectEntityTypes to discover every named
 *    entity type reachable from it (Product, Review, …).  An "entity type" is
 *    any named type alias whose declared type is a non-array object with at
 *    least one property (see isEntityType).
 * 4. For each discovered entity, locate its id field by scanning its
 *    properties for a name that normalizes to "id" or ends with "id"
 *    (e.g. _id, productId).
 * 5. Generate a self-contained listener effect function for each query that
 *    contains one named traverseXxx helper per entity and inline root-walk
 *    code that drives the traversal from the response root.
 * 6. Write all listeners into a single entityListeners.ts file.
 */

import ts from "typescript";
import * as fs from "node:fs";
import * as prettier from "prettier";
import { loadFile } from "./loadFile";
import { isEntityType } from "./isEntityType";
import { getArrayElementType } from "./getArrayElementType";
import { collectEntityTypes } from "./collectEntityTypes";
import type { EntityInfo } from "./collectEntityTypes";

// ─── code generation ──────────────────────────────────────────────────────────

/**
 * Generates a JavaScript code fragment that, at runtime, walks the value
 * held in `expr` (a JS expression string) and calls `traverseXxx(item, kp)`
 * for every entity instance it finds.
 *
 * Parameters
 *   checker   type checker for resolving property types.
 *   type      the static type of `expr`.
 *   expr      a JS expression string for the value being walked
 *             (e.g. "data", "data[i0]", "data.product").
 *   kp        a JS array-expression string for the keyPath accumulated so far
 *             (e.g. "[]", "[...keyPath, \"reviews\"]").  Each segment added
 *             here becomes part of the EntityLocation stored in the reducer.
 *   depth     loop-variable counter; incremented each time an array is entered
 *             to produce unique index variables i0, i1, i2, …
 *   entities  the set of named entity types collected for this query; only
 *             types present here get a traverseXxx call — others are walked
 *             through transparently.
 *
 * Dispatch strategy:
 *   Union with undefined/null   — strip nullable members; wrap inner code in
 *                                  a null-check `if (expr != null) { … }`.
 *   Array                       — emit a for-loop over the elements.
 *   Entity in `entities`        — emit `traverseXxx(expr, kp)`.
 *   Entity NOT in `entities`    — the type has no id field (e.g. a wrapper);
 *                                  fall through to property walking so nested
 *                                  entities inside it are still reached.
 *   Plain object                — recurse into each property.
 *   Anything else               — return "" (primitive, function, etc.).
 */
export function generateWalk(
  checker: ts.TypeChecker,
  type: ts.Type,
  expr: string,
  kp: string,
  depth: number,
  entities: Map<string, EntityInfo>,
  onEntity: (name: string, expr: string, kp: string) => string,
  loopGuard = "",
): string {
  let core = type;
  let nullable = false;
  if (type.isUnion()) {
    const nonNull = type.types.filter(
      (t) => !(t.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)),
    );
    if (!nonNull.length) return "";
    nullable = nonNull.length < type.types.length;
    // Complex unions with multiple non-null members (e.g. string | number) are
    // unlikely to contain entities and are hard to walk generically — skip them.
    if (nonNull.length > 1) return "";
    core = nonNull[0];
  }

  const elem = getArrayElementType(checker, core);
  if (elem) {
    const idx = `i${depth}`;
    const inner = generateWalk(checker, elem, `${expr}[${idx}]`, `[...${kp}, ${idx}]`, depth + 1, entities, onEntity, loopGuard);
    if (!inner) return "";
    const guardLine = loopGuard ? `${loopGuard}\n` : "";
    const loop = `for (let ${idx} = 0; ${idx} < ${expr}.length; ${idx}++) {\n${guardLine}${inner}\n}`;
    return nullable ? `if (${expr} != null) {\n${loop}\n}` : loop;
  }

  if (isEntityType(checker, core)) {
    const name = core.aliasSymbol!.getName();
    if (entities.has(name)) {
      const emit = onEntity(name, expr, kp);
      if (!emit.trim()) return "";
      return nullable ? `if (${expr} != null) {\n${emit}\n}` : emit;
    }
    // Named alias without an id field (wrapper type) — walk its properties.
    const declared = checker.getDeclaredTypeOfSymbol(core.aliasSymbol!);
    const lines: string[] = [];
    for (const prop of declared.getProperties()) {
      const decl = prop.valueDeclaration ?? prop.declarations?.[0];
      if (!decl) continue;
      const inner = generateWalk(checker, checker.getTypeOfSymbolAtLocation(prop, decl), `${expr}.${prop.getName()}`, `[...${kp}, "${prop.getName()}"]`, depth, entities, onEntity, loopGuard);
      if (inner) {
        lines.push(inner);
      }
    }
    const code = lines.join("\n");
    return code && nullable ? `if (${expr} != null) {\n${code}\n}` : code;
  }

  // Anonymous object type — walk each property (handles inline shapes such as
  // the object literal response types generated by @rtk-query/codegen-openapi).
  if (core.getFlags() & ts.TypeFlags.Object) {
    const lines: string[] = [];
    for (const prop of core.getProperties()) {
      const decl = prop.valueDeclaration ?? prop.declarations?.[0];
      if (!decl) continue;
      const inner = generateWalk(checker, checker.getTypeOfSymbolAtLocation(prop, decl), `${expr}.${prop.getName()}`, `[...${kp}, "${prop.getName()}"]`, depth, entities, onEntity, loopGuard);
      if (inner) {
        lines.push(inner);
      }
    }
    const code = lines.join("\n");
    return code && nullable ? `if (${expr} != null) {\n${code}\n}` : code;
  }

  return "";
}

// ─── walker code generation ───────────────────────────────────────────────────

function buildWalker(
  checker: ts.TypeChecker,
  queryName: string,
  responseTypeNode: ts.TypeNode,
): { walkerName: string; walkerCode: string; entities: Map<string, EntityInfo> } | null {
  const responseType = checker.getTypeFromTypeNode(responseTypeNode);
  const entities = new Map<string, EntityInfo>();
  collectEntityTypes(checker, responseType, entities, new Set());
  if (!entities.size) return null;

  const entityList = Array.from(entities.values());
  const params = entityList
    .map((info) => `on${info.name}: (item: any, keyPath: (string | number)[]) => void`)
    .join(", ");

  const onEntityPush = (name: string, expr: string, kp: string) =>
    `stack.push({ entityType: "${name}", item: ${expr}, keyPath: ${kp} });`;

  // Seed: walk root response and push initial entity instances onto the stack.
  const seed = generateWalk(checker, responseType, "data", "[]", 0, entities, onEntityPush);
  if (!seed) return null;

  // Loop body: one branch per entity type — invoke its callback then push any
  // nested entities it contains so they are processed in subsequent iterations.
  const branches = entityList.map((info) => {
    const declared = checker.getDeclaredTypeOfSymbol(info.type.aliasSymbol!);
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
        );
      })
      .filter(Boolean);

    return (
      `if (entry.entityType === "${info.name}") {\n` +
      `const { item, keyPath } = entry;\n` +
      `on${info.name}(item, keyPath);\n` +
      propPushes.join("\n") +
      `\n}`
    );
  });

  const stackType = entityList
    .map((info) => `{ entityType: "${info.name}"; item: any; keyPath: (string | number)[] }`)
    .join(" | ");

  const walkerName = `walk${queryName[0].toUpperCase()}${queryName.slice(1)}`;
  const walkerCode =
    `function ${walkerName}(data: any, ${params}) {\n` +
    `const stack: Array<${stackType}> = [];\n` +
    seed + "\n" +
    `while (stack.length > 0) {\n` +
    `const entry = stack.shift()!;\n` +
    branches.join(" else ") + "\n" +
    `}\n` +
    `}`;
  return { walkerName, walkerCode, entities };
}

// ─── listener effect builders ─────────────────────────────────────────────────

/**
 * Builds the matchFulfilled effect body.  Collects all entities found by the
 * walker into a batch array, then dispatches a single entityLoaded action.
 */
function buildLoadEffect(
  queryName: string,
  walkerName: string,
  entities: Map<string, EntityInfo>,
): string {
  const callbacks = Array.from(entities.values())
    .map(
      (info) =>
        `(item, keyPath) => batch.push({ entityType: "${info.name}", id: item.${info.idField}, keyPath, queryName: "${queryName}", queryArgs: arg })`,
    )
    .join(",\n");
  return (
    `(action, { dispatch }) => {\n` +
    `const data = action.payload;\n` +
    `const arg = action.meta.arg.originalArgs;\n` +
    `const batch: any[] = [];\n` +
    `${walkerName}(\ndata,\n${callbacks}\n);\n` +
    `if (batch.length) {\ndispatch(entityLoaded(batch));\n}\n` +
    `}`
  );
}

/**
 * Builds the removeQueryResult effect body.  Collects all entities found by
 * the walker into a batch array, then dispatches a single entityRemoved action.
 */
function buildRemovalEffect(
  queryName: string,
  walkerName: string,
  entities: Map<string, EntityInfo>,
): string {
  const callbacks = Array.from(entities.values())
    .map(
      (info) =>
        `(item) => batch.push({ entityType: "${info.name}", id: item.${info.idField}, queryCacheKey })`,
    )
    .join(",\n");
  return (
    `(action, { getOriginalState, dispatch }) => {\n` +
    `const { queryCacheKey } = action.payload;\n` +
    `const query = (getOriginalState() as any)[productApi.reducerPath]?.queries?.[queryCacheKey];\n` +
    `if (query?.endpointName !== "${queryName}") {\nreturn;\n}\n` +
    `const data = query.data as any;\n` +
    `if (!data) {\nreturn;\n}\n` +
    `const batch: any[] = [];\n` +
    `${walkerName}(\ndata,\n${callbacks}\n);\n` +
    `if (batch.length) {\ndispatch(entityRemoved(batch));\n}\n` +
    `}`
  );
}

/**
 * Builds the queryResultPatched effect body.  When updateQueryData patches a
 * cache entry, this removes entity mappings derived from the old data and adds
 * mappings derived from the new data, keeping entityMapping in sync with the
 * current cache contents.
 */
function buildPatchEffect(
  queryName: string,
  walkerName: string,
  entities: Map<string, EntityInfo>,
): string {
  const removeCallbacks = Array.from(entities.values())
    .map(
      (info) =>
        `(item) => removeBatch.push({ entityType: "${info.name}", id: item.${info.idField}, queryCacheKey })`,
    )
    .join(",\n");
  const loadCallbacks = Array.from(entities.values())
    .map(
      (info) =>
        `(item, keyPath) => loadBatch.push({ entityType: "${info.name}", id: item.${info.idField}, keyPath, queryName: query.endpointName, queryArgs: query.originalArgs })`,
    )
    .join(",\n");
  return (
    `(action, { getOriginalState, getState, dispatch }) => {\n` +
    `if ('fromEntityUpdate' in action.payload && action.payload.fromEntityUpdate) {\nreturn;\n}\n` +
    `const { queryCacheKey } = action.payload;\n` +
    `const query = (getState() as any)[productApi.reducerPath]?.queries?.[queryCacheKey];\n` +
    `if (query?.endpointName !== "${queryName}") {\nreturn;\n}\n` +
    `const oldData = (getOriginalState() as any)[productApi.reducerPath]?.queries?.[queryCacheKey]?.data;\n` +
    `const newData = query.data as any;\n` +
    `const removeBatch: any[] = [];\n` +
    `const loadBatch: any[] = [];\n` +
    `if (oldData) {\n${walkerName}(\noldData,\n${removeCallbacks}\n);\n}\n` +
    `if (newData) {\n${walkerName}(\nnewData,\n${loadCallbacks}\n);\n}\n` +
    `if (removeBatch.length) {\ndispatch(entityRemoved(removeBatch));\n}\n` +
    `if (loadBatch.length) {\ndispatch(entityLoaded(loadBatch));\n}\n` +
    `}`
  );
}

// ─── file writer ─────────────────────────────────────────────────────────────

/**
 * Analyses `apiFilePath` (productApi.ts) and writes `outputFilePath`
 * (entityListeners.ts).
 *
 * For each query endpoint with reachable entity types the output contains:
 *   - A shared `walkXxx(data, onA, onB, …)` function that owns the traversal
 *     logic for that endpoint.
 *   - A `matchFulfilled` listener that calls the walker with entityLoaded
 *     callbacks.
 *   - A `removeQueryResult` listener that calls the same walker with
 *     entityRemoved callbacks, reading data from getOriginalState().
 *
 * The file is formatted with prettier before being written so it integrates
 * cleanly into the codebase without noisy diffs.
 */
async function writeListenersFile(
  apiFilePath: string,
  outputFilePath: string,
): Promise<void> {
  const { checker, sourceFile } = loadFile(apiFilePath);
  const blocks: string[] = [];

  function visit(node: ts.Node) {
    // We are looking for call expressions of the form
    //   build.query<ResponseType, ArgType>({ query: ... })
    // The endpoint name is on the surrounding PropertyAssignment node and the
    // response type is the first type argument of the call.
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "query" &&
      node.typeArguments?.length &&
      node.arguments.length > 0 &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      const parent = node.parent;
      if (parent && ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
        const queryName = parent.name.text;
        const walker = buildWalker(checker, queryName, node.typeArguments![0]);
        if (walker) {
          const { walkerName, walkerCode, entities } = walker;
          blocks.push(
            walkerCode + "\n\n" +
            `entityListenerMiddleware.startListening({\n` +
            `  matcher: productApi.endpoints.${queryName}.matchFulfilled,\n` +
            `  effect: ${buildLoadEffect(queryName, walkerName, entities)},\n` +
            `});\n\n` +
            `entityListenerMiddleware.startListening({\n` +
            `  matcher: productApi.internalActions.removeQueryResult.match,\n` +
            `  effect: ${buildRemovalEffect(queryName, walkerName, entities)},\n` +
            `});\n\n` +
            `entityListenerMiddleware.startListening({\n` +
            `  matcher: productApi.internalActions.queryResultPatched.match,\n` +
            `  effect: ${buildPatchEffect(queryName, walkerName, entities)},\n` +
            `});`,
          );
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  if (!blocks.length) return;

  const content =
    `/* eslint-disable @typescript-eslint/no-explicit-any */\n` +
    `import { createListenerMiddleware } from "@reduxjs/toolkit";\n` +
    `import { productApi } from "./productApi";\n` +
    `import { entityLoaded, entityRemoved } from "./entityActions";\n\n` +
    `export const entityListenerMiddleware = createListenerMiddleware();\n\n` +
    blocks.join("\n\n");

  fs.writeFileSync(outputFilePath, await prettier.format(content, { filepath: outputFilePath }));
}

// ─── public API ───────────────────────────────────────────────────────────────

export async function generateEntityListeners(
  apiFilePath: string,
  outputFilePath: string,
): Promise<void> {
  await writeListenersFile(apiFilePath, outputFilePath);
}