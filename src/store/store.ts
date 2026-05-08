import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { productApi } from "@/src/store/productApi";
// import { mutationListenerMiddleware } from "./generated/mutationListeners";

import { useDispatch, useSelector } from "react-redux";
import { wrapApiReducer } from "@/src/scripts/content/wrapApiReducer";
import { setupMutationListeners } from "@/src/scripts/content/mutationListeners";

const listenerMiddleware = createListenerMiddleware();

export const store = configureStore({
  reducer: {
    [productApi.reducerPath]: wrapApiReducer(productApi.reducer),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
      .concat(listenerMiddleware.middleware)
      .concat(productApi.middleware),
});

setupMutationListeners(listenerMiddleware);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
