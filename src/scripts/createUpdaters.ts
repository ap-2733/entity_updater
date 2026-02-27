import { Mapping } from "@/src/scripts/types";

export function createUpdaters(mapping: Mapping) {
  const modelNames = Object.keys(mapping);

  const imports = `
import { createAsyncThunk } from "@reduxjs/toolkit";
import { productApi } from "@/src/store/productApi";
import { mapping } from "@/src/store/mapping";
import { updateEntity } from "@/src/store/updateEntity";
import type { ${modelNames.join(", ")} } from "@/src/store/productApi";

`;

  const updaters = modelNames.map((modelName) => {
    return `
export const update${modelName}Entity = createAsyncThunk(
  "Update${modelName}Entity",
  async (
    payload: {
      filter: Partial<${modelName}>;
      update: Partial<${modelName}>;
    },
    thunkApi,
  ) => {
    await updateEntity(
      mapping["${modelName}"],
      thunkApi.getState,
      thunkApi.dispatch,
      productApi,
      payload.filter,
      payload.update,
    );
  },
);
`;
  });

  return imports + updaters.join("\n");
}
