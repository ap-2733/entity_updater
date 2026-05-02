import { createTestStore } from "./testStore";
import { productApi } from "../src/store/productApi";
import { updateProductEntity } from "../src/store/updaters";
import { deal1, deal2, product1, product2, review1, review2 } from "./mockData";

test("fetches and updates product", async () => {
  const store = createTestStore();

  await store.dispatch(productApi.endpoints.getProducts.initiate({}));

  await store.dispatch(
    productApi.endpoints.getProductsById.initiate({
      id: "69909bf8b3727d25467b2056",
    }),
  );

  await store.dispatch(
    productApi.endpoints.getProductsSearch.initiate({
      name: "Chain Crossbody Clutch",
    }),
  );

  await store.dispatch(
    updateProductEntity({
      filter: { _id: "69909bf8b3727d25467b2056" },
      update: { name: "Updated Product Name" },
    }),
  );

  const result = productApi.endpoints.getProducts.select({})(store.getState());
  expect(result.data?.[0].name).toBe("Updated Product Name");

  const result2 = productApi.endpoints.getProductsById.select({
    id: "69909bf8b3727d25467b2056",
  })(store.getState());
  expect(result2.data.product.name).toBe("Updated Product Name");

  const result3 = productApi.endpoints.getProductsSearch.select({
    name: "Chain Crossbody Clutch",
  })(store.getState());
  expect(result3.data[0].name).toBe("Updated Product Name");
});

test("fetches deals and tracks entityMapping", async () => {
  const store = createTestStore();

  await store.dispatch(productApi.endpoints.getProductsDeals.initiate());

  const { entityMapping } = store.getState().api;
  const dealsCacheKey = "getProductsDeals(undefined)";

  expect(entityMapping.Deal?.["deal001"]?.[dealsCacheKey]).toEqual([[0]]);
  expect(entityMapping.Deal?.["deal002"]?.[dealsCacheKey]).toEqual([[1]]);
});

test("fetches product with reviews and tracks entityMapping", async () => {
  const store = createTestStore();

  await store.dispatch(
    productApi.endpoints.getProductsById.initiate({
      id: "69909bf8b3727d25467b2056",
    }),
  );

  const { entityMapping } = store.getState().api;
  const byIdCacheKey = 'getProductsById({"id":"69909bf8b3727d25467b2056"})';

  expect(entityMapping.Review?.["review001"]?.[byIdCacheKey]).toEqual([
    ["reviews", 0],
  ]);
  expect(entityMapping.Review?.["review002"]?.[byIdCacheKey]).toEqual([
    ["reviews", 1],
  ]);
});

test("upsertQueryData for getProducts populates entityMapping", async () => {
  const store = createTestStore();

  await store.dispatch(
    productApi.util.upsertQueryData("getProducts", {}, [product1, product2]),
  );

  const { entityMapping } = store.getState().api;
  const cacheKey = "getProducts({})";

  // product1 appears at [0] directly and at [1, "relatedProducts", 0] via product2
  expect(entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[cacheKey]).toEqual([
    [0],
    [1, "relatedProducts", 0],
  ]);
  expect(entityMapping.Product?.["69909bf8b3727d25467b2057"]?.[cacheKey]).toEqual([[1]]);
});

test("upsertQueryData for getProductsDeals populates entityMapping", async () => {
  const store = createTestStore();

  await store.dispatch(
    productApi.util.upsertQueryData("getProductsDeals", undefined, [deal1, deal2]),
  );

  const { entityMapping } = store.getState().api;
  const cacheKey = "getProductsDeals(undefined)";

  expect(entityMapping.Deal?.["deal001"]?.[cacheKey]).toEqual([[0]]);
  expect(entityMapping.Deal?.["deal002"]?.[cacheKey]).toEqual([[1]]);
});

test("removeQueryResult removes cache key from entityMapping", async () => {
  const store = createTestStore();

  await store.dispatch(productApi.endpoints.getProductsDeals.initiate());

  const dealsCacheKey = "getProductsDeals(undefined)";
  expect(store.getState().api.entityMapping.Deal?.["deal001"]?.[dealsCacheKey]).toBeDefined();
  expect(store.getState().api.entityMapping.Deal?.["deal002"]?.[dealsCacheKey]).toBeDefined();

  store.dispatch(
    productApi.internalActions.removeQueryResult({ queryCacheKey: dealsCacheKey }),
  );

  const { entityMapping } = store.getState().api;
  expect(entityMapping.Deal?.["deal001"]?.[dealsCacheKey]).toBeUndefined();
  expect(entityMapping.Deal?.["deal002"]?.[dealsCacheKey]).toBeUndefined();
});

test("entityMapping is cleaned up when deals query cache expires after last unsubscribe", async () => {
  const store = createTestStore();
  const dealsCacheKey = "getProductsDeals(undefined)";

  const sub = store.dispatch(productApi.endpoints.getProductsDeals.initiate());
  await sub;
  expect(store.getState().api.entityMapping.Deal?.["deal001"]?.[dealsCacheKey]).toBeDefined();
  expect(store.getState().api.entityMapping.Deal?.["deal002"]?.[dealsCacheKey]).toBeDefined();

  sub.unsubscribe();
  await jest.runAllTimersAsync();

  expect(store.getState().api.entityMapping.Deal).toBeUndefined();
});

test("entityMapping is cleaned up when getProductsById cache expires, including nested reviews", async () => {
  const store = createTestStore();
  const byIdCacheKey = 'getProductsById({"id":"69909bf8b3727d25467b2056"})';

  const sub = store.dispatch(
    productApi.endpoints.getProductsById.initiate({ id: "69909bf8b3727d25467b2056" }),
  );
  await sub;
  expect(store.getState().api.entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[byIdCacheKey]).toBeDefined();
  expect(store.getState().api.entityMapping.Review?.["review001"]?.[byIdCacheKey]).toBeDefined();
  expect(store.getState().api.entityMapping.Review?.["review002"]?.[byIdCacheKey]).toBeDefined();

  sub.unsubscribe();
  await jest.runAllTimersAsync();

  expect(store.getState().api.entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[byIdCacheKey]).toBeUndefined();
  expect(store.getState().api.entityMapping.Review).toBeUndefined();
});

test("expiring one query only removes its cache key from entityMapping, leaving other queries intact", async () => {
  const store = createTestStore();
  const productsCacheKey = "getProducts({})";
  const byIdCacheKey = 'getProductsById({"id":"69909bf8b3727d25467b2056"})';

  const listSub = store.dispatch(productApi.endpoints.getProducts.initiate({}));
  const byIdSub = store.dispatch(
    productApi.endpoints.getProductsById.initiate({ id: "69909bf8b3727d25467b2056" }),
  );
  await listSub;
  await byIdSub;

  // product1 appears in both queries
  expect(store.getState().api.entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[productsCacheKey]).toBeDefined();
  expect(store.getState().api.entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[byIdCacheKey]).toBeDefined();

  listSub.unsubscribe();
  await jest.runAllTimersAsync();

  // product1's entry for the expired query is gone, but its byId entry survives
  expect(store.getState().api.entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[productsCacheKey]).toBeUndefined();
  expect(store.getState().api.entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[byIdCacheKey]).toBeDefined();

  byIdSub.unsubscribe();
});

test("updateQueryData removing an entity removes it from entityMapping", async () => {
  const store = createTestStore();
  const cacheKey = "getProductsDeals(undefined)";

  await store.dispatch(
    productApi.util.upsertQueryData("getProductsDeals", undefined, [deal1, deal2]),
  );
  expect(store.getState().api.entityMapping.Deal?.["deal001"]?.[cacheKey]).toBeDefined();
  expect(store.getState().api.entityMapping.Deal?.["deal002"]?.[cacheKey]).toBeDefined();

  // Remove deal1 by replacing the list with only deal2
  await store.dispatch(
    productApi.util.updateQueryData("getProductsDeals", undefined, () => [deal2]),
  );

  expect(store.getState().api.entityMapping.Deal?.["deal001"]).toBeUndefined();
  expect(store.getState().api.entityMapping.Deal?.["deal002"]?.[cacheKey]).toEqual([[0]]);
});

test("updateQueryData adding an entity adds it to entityMapping", async () => {
  const store = createTestStore();
  const cacheKey = "getProductsDeals(undefined)";

  await store.dispatch(
    productApi.util.upsertQueryData("getProductsDeals", undefined, [deal1]),
  );
  expect(store.getState().api.entityMapping.Deal?.["deal002"]).toBeUndefined();

  await store.dispatch(
    productApi.util.updateQueryData("getProductsDeals", undefined, (draft) => {
      draft.push(deal2);
    }),
  );

  expect(store.getState().api.entityMapping.Deal?.["deal001"]?.[cacheKey]).toEqual([[0]]);
  expect(store.getState().api.entityMapping.Deal?.["deal002"]?.[cacheKey]).toEqual([[1]]);
});

test("updateQueryData changing relatedProducts updates nested entity keypaths", async () => {
  const store = createTestStore();
  const cacheKey = "getProducts({})";

  // product2 has relatedProducts: [product1], so product1 maps at [0] and [1,"relatedProducts",0]
  await store.dispatch(
    productApi.util.upsertQueryData("getProducts", {}, [product1, product2]),
  );
  expect(store.getState().api.entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[cacheKey]).toEqual([
    [0],
    [1, "relatedProducts", 0],
  ]);

  // Remove relatedProducts from product2
  await store.dispatch(
    productApi.util.updateQueryData("getProducts", {}, (draft) => {
      draft[1].relatedProducts = [];
    }),
  );

  // product1 now only appears at its own position
  expect(store.getState().api.entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[cacheKey]).toEqual([[0]]);
  expect(store.getState().api.entityMapping.Product?.["69909bf8b3727d25467b2057"]?.[cacheKey]).toEqual([[1]]);
});

test("upsertQueryData for getProductsById populates entityMapping for product and reviews", async () => {
  const store = createTestStore();

  await store.dispatch(
    productApi.util.upsertQueryData(
      "getProductsById",
      { id: "69909bf8b3727d25467b2056" },
      { product: product1, reviews: [review1, review2] },
    ),
  );

  const { entityMapping } = store.getState().api;
  const cacheKey = 'getProductsById({"id":"69909bf8b3727d25467b2056"})';

  expect(entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[cacheKey]).toEqual([["product"]]);
  expect(entityMapping.Review?.["review001"]?.[cacheKey]).toEqual([["reviews", 0]]);
  expect(entityMapping.Review?.["review002"]?.[cacheKey]).toEqual([["reviews", 1]]);
});