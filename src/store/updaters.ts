import { createAsyncThunk } from "@reduxjs/toolkit";
import { productApi } from "@/src/store/productApi";
import { mapping } from "@/src/store/mapping";
import { updateEntity } from "@/src/store/updateEntity";
import type {
  Product,
  Deal,
  GetProductsByIdApiResponse,
  Review,
} from "@/src/store/productApi";

export const updateProductEntity = createAsyncThunk(
  "UpdateProductEntity",
  async (
    payload: {
      filter: Partial<Product>;
      update: Partial<Product>;
    },
    thunkApi,
  ) => {
    await updateEntity(
      mapping["Product"],
      thunkApi.getState,
      thunkApi.dispatch,
      productApi,
      payload.filter,
      payload.update,
    );
  },
);

export const updateDealEntity = createAsyncThunk(
  "UpdateDealEntity",
  async (
    payload: {
      filter: Partial<Deal>;
      update: Partial<Deal>;
    },
    thunkApi,
  ) => {
    await updateEntity(
      mapping["Deal"],
      thunkApi.getState,
      thunkApi.dispatch,
      productApi,
      payload.filter,
      payload.update,
    );
  },
);

export const updateGetProductsByIdApiResponseEntity = createAsyncThunk(
  "UpdateGetProductsByIdApiResponseEntity",
  async (
    payload: {
      filter: Partial<GetProductsByIdApiResponse>;
      update: Partial<GetProductsByIdApiResponse>;
    },
    thunkApi,
  ) => {
    await updateEntity(
      mapping["GetProductsByIdApiResponse"],
      thunkApi.getState,
      thunkApi.dispatch,
      productApi,
      payload.filter,
      payload.update,
    );
  },
);

export const updateReviewEntity = createAsyncThunk(
  "UpdateReviewEntity",
  async (
    payload: {
      filter: Partial<Review>;
      update: Partial<Review>;
    },
    thunkApi,
  ) => {
    await updateEntity(
      mapping["Review"],
      thunkApi.getState,
      thunkApi.dispatch,
      productApi,
      payload.filter,
      payload.update,
    );
  },
);
