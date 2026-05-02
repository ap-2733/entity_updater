/* eslint-disable @typescript-eslint/no-explicit-any */
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { productApi } from "./productApi";
import { entityLoaded, entityRemoved } from "./entityActions";

export const entityListenerMiddleware = createListenerMiddleware();

function walkGetProducts(
  data: any,
  onProduct: (item: any, keyPath: (string | number)[]) => void,
) {
  function traverseProduct(item: any, keyPath: (string | number)[]) {
    onProduct(item, keyPath);
    if (item.relatedProducts != null) {
      for (let i0 = 0; i0 < item.relatedProducts.length; i0++) {
        traverseProduct(item.relatedProducts[i0], [
          ...[...keyPath, "relatedProducts"],
          i0,
        ]);
      }
    }
  }
  for (let i0 = 0; i0 < data.length; i0++) {
    traverseProduct(data[i0], [...[], i0]);
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getProducts.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetProducts(data, (item, keyPath) =>
      batch.push({
        entityType: "Product",
        id: item._id,
        keyPath,
        queryName: "getProducts",
        queryArgs: arg,
      }),
    );
    if (batch.length) dispatch(entityLoaded(batch));
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getProducts") return;
    const data = query.data as any;
    if (!data) return;
    const batch: any[] = [];
    walkGetProducts(data, (item) =>
      batch.push({ entityType: "Product", id: item._id, queryCacheKey }),
    );
    if (batch.length) dispatch(entityRemoved(batch));
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if ("fromEntityUpdate" in action.payload && action.payload.fromEntityUpdate)
      return;
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getProducts") return;
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData)
      walkGetProducts(oldData, (item) =>
        removeBatch.push({
          entityType: "Product",
          id: item._id,
          queryCacheKey,
        }),
      );
    if (newData)
      walkGetProducts(newData, (item, keyPath) =>
        loadBatch.push({
          entityType: "Product",
          id: item._id,
          keyPath,
          queryName: query.endpointName,
          queryArgs: query.originalArgs,
        }),
      );
    if (removeBatch.length) dispatch(entityRemoved(removeBatch));
    if (loadBatch.length) dispatch(entityLoaded(loadBatch));
  },
});

function walkGetProductsDeals(
  data: any,
  onDeal: (item: any, keyPath: (string | number)[]) => void,
) {
  function traverseDeal(item: any, keyPath: (string | number)[]) {
    onDeal(item, keyPath);
  }
  for (let i0 = 0; i0 < data.length; i0++) {
    traverseDeal(data[i0], [...[], i0]);
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getProductsDeals.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetProductsDeals(data, (item, keyPath) =>
      batch.push({
        entityType: "Deal",
        id: item._id,
        keyPath,
        queryName: "getProductsDeals",
        queryArgs: arg,
      }),
    );
    if (batch.length) dispatch(entityLoaded(batch));
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getProductsDeals") return;
    const data = query.data as any;
    if (!data) return;
    const batch: any[] = [];
    walkGetProductsDeals(data, (item) =>
      batch.push({ entityType: "Deal", id: item._id, queryCacheKey }),
    );
    if (batch.length) dispatch(entityRemoved(batch));
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if ("fromEntityUpdate" in action.payload && action.payload.fromEntityUpdate)
      return;
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getProductsDeals") return;
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData)
      walkGetProductsDeals(oldData, (item) =>
        removeBatch.push({ entityType: "Deal", id: item._id, queryCacheKey }),
      );
    if (newData)
      walkGetProductsDeals(newData, (item, keyPath) =>
        loadBatch.push({
          entityType: "Deal",
          id: item._id,
          keyPath,
          queryName: query.endpointName,
          queryArgs: query.originalArgs,
        }),
      );
    if (removeBatch.length) dispatch(entityRemoved(removeBatch));
    if (loadBatch.length) dispatch(entityLoaded(loadBatch));
  },
});

function walkGetProductsSearch(
  data: any,
  onProduct: (item: any, keyPath: (string | number)[]) => void,
) {
  function traverseProduct(item: any, keyPath: (string | number)[]) {
    onProduct(item, keyPath);
    if (item.relatedProducts != null) {
      for (let i0 = 0; i0 < item.relatedProducts.length; i0++) {
        traverseProduct(item.relatedProducts[i0], [
          ...[...keyPath, "relatedProducts"],
          i0,
        ]);
      }
    }
  }
  for (let i0 = 0; i0 < data.length; i0++) {
    traverseProduct(data[i0], [...[], i0]);
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getProductsSearch.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetProductsSearch(data, (item, keyPath) =>
      batch.push({
        entityType: "Product",
        id: item._id,
        keyPath,
        queryName: "getProductsSearch",
        queryArgs: arg,
      }),
    );
    if (batch.length) dispatch(entityLoaded(batch));
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getProductsSearch") return;
    const data = query.data as any;
    if (!data) return;
    const batch: any[] = [];
    walkGetProductsSearch(data, (item) =>
      batch.push({ entityType: "Product", id: item._id, queryCacheKey }),
    );
    if (batch.length) dispatch(entityRemoved(batch));
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if ("fromEntityUpdate" in action.payload && action.payload.fromEntityUpdate)
      return;
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getProductsSearch") return;
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData)
      walkGetProductsSearch(oldData, (item) =>
        removeBatch.push({
          entityType: "Product",
          id: item._id,
          queryCacheKey,
        }),
      );
    if (newData)
      walkGetProductsSearch(newData, (item, keyPath) =>
        loadBatch.push({
          entityType: "Product",
          id: item._id,
          keyPath,
          queryName: query.endpointName,
          queryArgs: query.originalArgs,
        }),
      );
    if (removeBatch.length) dispatch(entityRemoved(removeBatch));
    if (loadBatch.length) dispatch(entityLoaded(loadBatch));
  },
});

function walkGetProductsById(
  data: any,
  onProduct: (item: any, keyPath: (string | number)[]) => void,
  onReview: (item: any, keyPath: (string | number)[]) => void,
) {
  function traverseProduct(item: any, keyPath: (string | number)[]) {
    onProduct(item, keyPath);
    if (item.relatedProducts != null) {
      for (let i0 = 0; i0 < item.relatedProducts.length; i0++) {
        traverseProduct(item.relatedProducts[i0], [
          ...[...keyPath, "relatedProducts"],
          i0,
        ]);
      }
    }
  }

  function traverseReview(item: any, keyPath: (string | number)[]) {
    onReview(item, keyPath);
  }
  if (data.product != null) {
    traverseProduct(data.product, [...[], "product"]);
  }
  if (data.reviews != null) {
    for (let i0 = 0; i0 < data.reviews.length; i0++) {
      traverseReview(data.reviews[i0], [...[...[], "reviews"], i0]);
    }
  }
}

entityListenerMiddleware.startListening({
  matcher: productApi.endpoints.getProductsById.matchFulfilled,
  effect: (action, { dispatch }) => {
    const data = action.payload;
    const arg = action.meta.arg.originalArgs;
    const batch: any[] = [];
    walkGetProductsById(
      data,
      (item, keyPath) =>
        batch.push({
          entityType: "Product",
          id: item._id,
          keyPath,
          queryName: "getProductsById",
          queryArgs: arg,
        }),
      (item, keyPath) =>
        batch.push({
          entityType: "Review",
          id: item._id,
          keyPath,
          queryName: "getProductsById",
          queryArgs: arg,
        }),
    );
    if (batch.length) dispatch(entityLoaded(batch));
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.removeQueryResult.match,
  effect: (action, { getOriginalState, dispatch }) => {
    const { queryCacheKey } = action.payload;
    const query = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey];
    if (query?.endpointName !== "getProductsById") return;
    const data = query.data as any;
    if (!data) return;
    const batch: any[] = [];
    walkGetProductsById(
      data,
      (item) =>
        batch.push({ entityType: "Product", id: item._id, queryCacheKey }),
      (item) =>
        batch.push({ entityType: "Review", id: item._id, queryCacheKey }),
    );
    if (batch.length) dispatch(entityRemoved(batch));
  },
});

entityListenerMiddleware.startListening({
  matcher: productApi.internalActions.queryResultPatched.match,
  effect: (action, { getOriginalState, getState, dispatch }) => {
    if ("fromEntityUpdate" in action.payload && action.payload.fromEntityUpdate)
      return;
    const { queryCacheKey } = action.payload;
    const query = (getState() as any)[productApi.reducerPath]?.queries?.[
      queryCacheKey
    ];
    if (query?.endpointName !== "getProductsById") return;
    const oldData = (getOriginalState() as any)[productApi.reducerPath]
      ?.queries?.[queryCacheKey]?.data;
    const newData = query.data as any;
    const removeBatch: any[] = [];
    const loadBatch: any[] = [];
    if (oldData)
      walkGetProductsById(
        oldData,
        (item) =>
          removeBatch.push({
            entityType: "Product",
            id: item._id,
            queryCacheKey,
          }),
        (item) =>
          removeBatch.push({
            entityType: "Review",
            id: item._id,
            queryCacheKey,
          }),
      );
    if (newData)
      walkGetProductsById(
        newData,
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Product",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
        (item, keyPath) =>
          loadBatch.push({
            entityType: "Review",
            id: item._id,
            keyPath,
            queryName: query.endpointName,
            queryArgs: query.originalArgs,
          }),
      );
    if (removeBatch.length) dispatch(entityRemoved(removeBatch));
    if (loadBatch.length) dispatch(entityLoaded(loadBatch));
  },
});
