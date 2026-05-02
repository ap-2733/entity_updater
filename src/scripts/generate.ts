import { generateEntityListeners } from "./generateEntityListeners";

async function main() {
  await generateEntityListeners(
    "./src/store/productApi.ts",
    "./src/store/entityListeners.ts",
  );
}

main();