import { configureStore } from "@reduxjs/toolkit";
import { productApi } from "@/src/store/productApi";
import { apiReducer } from "@/src/store/apiReducer";
import { entityListenerMiddleware } from "@/src/store/entityListeners";

export function createTestStore() {
  return configureStore({
    reducer: {
      [productApi.reducerPath]: apiReducer,
    },
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware()
        .prepend(entityListenerMiddleware.middleware)
        .concat(productApi.middleware);
    },
  });
}
