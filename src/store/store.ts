import { configureStore } from "@reduxjs/toolkit";
import { productApi } from "@/src/store/productApi";
import { apiReducer } from "@/src/store/apiReducer";
import { entityListenerMiddleware } from "@/src/store/entityListeners";
import { useDispatch, useSelector } from "react-redux";

export const store = configureStore({
  reducer: {
    [productApi.reducerPath]: apiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(entityListenerMiddleware.middleware)
      .concat(productApi.middleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
