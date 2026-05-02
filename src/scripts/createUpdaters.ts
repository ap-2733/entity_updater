import { Mapping } from "@/src/scripts/types";

export function createUpdaters(mapping: Mapping) {
  const modelNames = Object.keys(mapping);

  const imports = `
import { createAsyncThunk } from "@reduxjs/toolkit";
import { productApi } from "@/src/store/productApi";
import { updateEntity } from "@/src/store/updateEntity";
import type { ${modelNames.join(", ")} } from "@/src/store/productApi";

`;

  const updaters = modelNames.map((modelName) => {
    return `
export const update${modelName}Entity = createAsyncThunk(
  "Update${modelName}Entity",
  async (
    payload: {
      id: string;
      update: Partial<${modelName}>;
    },
    thunkApi,
  ) => {
    await updateEntity(
      "${modelName}",
      payload.id,
      (draft) => Object.assign(draft, payload.update),
      thunkApi.getState,
      thunkApi.dispatch,
      productApi,
    );
  },
);
`;
  });

  return imports + updaters.join("\n");
}