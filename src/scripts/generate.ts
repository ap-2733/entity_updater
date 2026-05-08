import { generateTypeSchema } from "./ts-utils/generateTypeSchema";
// import * as fs from "node:fs";

const CONTENT_DIR = "./src/scripts/content";
// const GENERATED_DIR = "./src/store/generated";

// Relative imports in src/scripts/content/ that resolve differently from src/store/generated/
// const PATH_REMAPS: [string, string][] = [
//   ['"../../store/productApi"', '"../productApi"'],
//   ['"../../store/store"', '"../store"'],
// ];

// function copyWithRemappedImports(src: string, dest: string): void {
//   let content = fs.readFileSync(src, "utf-8");
//   for (const [from, to] of PATH_REMAPS) {
//     content = content.replaceAll(from, to);
//   }
//   fs.writeFileSync(dest, content);
// }

async function main() {
  await generateTypeSchema(
    "./src/store/productApi.ts",
    `${CONTENT_DIR}/apiMap.ts`,
  );

  // for (const file of fs.readdirSync(CONTENT_DIR)) {
  //   copyWithRemappedImports(`${CONTENT_DIR}/${file}`, `${GENERATED_DIR}/${file}`);
  // }
}

main();
