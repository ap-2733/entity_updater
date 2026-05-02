import { generateEntityListeners } from "./generateEntityListeners";
import { generateUpdateEntity } from "./generateUpdateEntity";

async function main() {
  await generateEntityListeners(
    "./src/store/productApi.ts",
    "./src/store/entityListeners.ts",
  );
  await generateUpdateEntity(
    "./src/store/productApi.ts",
    "./src/store/updateEntity.ts",
  );
}

main();