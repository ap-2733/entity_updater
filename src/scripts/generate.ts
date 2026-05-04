import { generateEntityListeners } from "./generateEntityListeners";
import { generateUpdateEntity } from "./generateUpdateEntity";
import { generateTypeReachability } from "./generateTypeReachability";
import { generateWalkEntityType } from "./generateWalkEntityType";
import { generateEntityIdFields } from "./generateEntityIdFields";

async function main() {
  await generateEntityListeners(
    "./src/store/productApi.ts",
    "./src/store/entityListeners.ts",
  );
  await generateUpdateEntity(
    "./src/store/productApi.ts",
    "./src/store/updateEntity.ts",
  );
  await generateTypeReachability(
    "./src/store/productApi.ts",
    "./src/store/typeReachability.ts",
  );
  await generateWalkEntityType(
    "./src/store/productApi.ts",
    "./src/store/walkEntityType.ts",
  );
  await generateEntityIdFields(
    "./src/store/productApi.ts",
    "./src/store/entityIdFields.ts",
  );
}

main();