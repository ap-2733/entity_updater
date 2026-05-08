import { generateTypeSchema } from "./ts-utils/generateTypeSchema";

async function main() {
  await generateTypeSchema(
    "./src/store/productApi.ts",
    `./src/store/generated/productApi.ts`,
  );
}

main();
