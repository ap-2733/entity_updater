import * as fs from "node:fs";
import { buildMapping, getMappingText } from "./buildMapping";
import { createUpdaters } from "./createUpdaters";
import * as prettier from "prettier";

async function main() {
  const mapping = buildMapping("./src/store/productApi.ts");

  fs.writeFileSync(
    "./src/store/mapping.ts",
    await prettier.format(getMappingText(mapping), {
      filepath: "./src/store/mapping.ts",
    }),
  );
  fs.writeFileSync(
    "./src/store/updaters.ts",
    await prettier.format(createUpdaters(mapping), {
      filepath: "./src/store/updaters.ts",
    }),
  );
}

main();
