import { configureStore } from "@reduxjs/toolkit";
import { productApi } from "@/src/store/productApi";
import { mutationListenerMiddleware } from "@/src/scripts/utils/mutationListeners";

import { useDispatch, useSelector } from "react-redux";

export const store = configureStore({
  reducer: {
    [productApi.reducerPath]: productApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
      .concat(mutationListenerMiddleware.middleware)
      .concat(productApi.middleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
