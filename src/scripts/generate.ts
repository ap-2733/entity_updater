import { generateTypeSchema } from "./generateTypeSchema";

async function main() {
  await generateTypeSchema(
    "./src/store/productApi.ts",
    "./src/store/typeReachability.ts",
  );
}

main();