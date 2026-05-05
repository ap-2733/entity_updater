import { configureStore } from "@reduxjs/toolkit";
import { productApi } from "@/src/store/productApi";

export function createTestStore() {
  return configureStore({
    reducer: {
      [productApi.reducerPath]: productApi.reducer,
    },
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware().concat(productApi.middleware);
    },
  });
}
