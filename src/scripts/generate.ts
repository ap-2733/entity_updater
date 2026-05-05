import { generateTypeSchema } from "./generateTypeSchema";
import { generateEntityIdFields } from "./generateEntityIdFields";

async function main() {
  await generateTypeSchema(
    "./src/store/productApi.ts",
    "./src/store/typeReachability.ts",
  );
  await generateEntityIdFields(
    "./src/store/productApi.ts",
    "./src/store/entityIdFields.ts",
  );
}

main();