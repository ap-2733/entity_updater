import ts from "typescript";

export function loadFile(filePath: string) {
  const program = ts.createProgram([filePath], {
    strict: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
  });

  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(filePath);

  if (!sourceFile) {
    throw new Error("Source file not found");
  }
  return { checker, sourceFile };
}
