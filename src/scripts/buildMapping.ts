import ts from "typescript";
import { findQueries } from "./findQueries";
import { visitTypes } from "./visitTypes";
import { loadFile } from "./loadFile";
import { initMapping } from "./initMapping";
import { Mapping } from "./types";

export function buildMapping(filePath: string): Mapping {
  const { checker, sourceFile } = loadFile(filePath);

  const { mapping, addMapping } = initMapping();

  const visitQuery = (
    node: ts.TypeNode,
    queryName: string,
    keyPath: string[],
  ) =>
    visitTypes(
      checker,
      checker.getTypeFromTypeNode(node),
      queryName,
      keyPath,
      addMapping,
    );

  findQueries(sourceFile, visitQuery);

  return mapping;
}

export function getMappingText(mapping: Mapping) {
  return `
import {Mapping} from "@/src/store/types";

export const mapping: Mapping = ${JSON.stringify(mapping, null, 2)}`;
}
