import { createTestStore } from "./testStore";
import { productApi } from "../src/store/productApi";
import { deal1, deal2, product1, product2, product3, review1, review2 } from "./mockData";
import { updateEntity } from "../src/store/updateEntity";

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
    updateEntity({
      typeName: 'Product',
      id: "69909bf8b3727d25467b2056",
      update: (draft) => { draft.name = "Updated Product Name"; },
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

test("updateEntity is a no-op when typeName is not in entityMapping", async () => {
  const store = createTestStore();
  await store.dispatch(productApi.endpoints.getProducts.initiate({}));

  const mappingBefore = store.getState().api.entityMapping;
  store.dispatch(
    updateEntity({
      typeName: "NonExistent",
      id: product1._id,
      update: (draft) => { draft.name = "Should Not Change"; },
    }),
  );

  expect(store.getState().api.entityMapping).toBe(mappingBefore);
  const result = productApi.endpoints.getProducts.select({})(store.getState());
  expect(result.data[0].name).toBe(product1.name);
});

test("updateEntity is a no-op when entity id is not tracked", async () => {
  const store = createTestStore();
  await store.dispatch(productApi.endpoints.getProducts.initiate({}));

  const mappingBefore = store.getState().api.entityMapping;
  store.dispatch(
    updateEntity({
      typeName: "Product",
      id: "nonexistent-id",
      update: (draft) => { draft.name = "Should Not Change"; },
    }),
  );

  expect(store.getState().api.entityMapping).toBe(mappingBefore);
});

test("updateEntity produces no side effects when update makes no changes", async () => {
  const store = createTestStore();
  await store.dispatch(productApi.endpoints.getProducts.initiate({}));

  store.dispatch(
    updateEntity({
      typeName: "Product",
      id: product1._id,
      update: (draft) => { draft.name = product1.name; },
    }),
  );

  const result = productApi.endpoints.getProducts.select({})(store.getState());
  expect(result.data[0].name).toBe(product1.name);
  expect(result.data[1].name).toBe(product2.name);
  expect(result.data[2].name).toBe(product3.name);
});

test("updateEntity updates a Review entity in getProductsById cache", async () => {
  const store = createTestStore();

  await store.dispatch(
    productApi.endpoints.getProductsById.initiate({ id: "69909bf8b3727d25467b2056" }),
  );

  await store.dispatch(
    updateEntity({
      typeName: "Review",
      id: "review001",
      update: (draft) => { draft.comment = "Updated comment!"; },
    }),
  );

  const result = productApi.endpoints.getProductsById.select({
    id: "69909bf8b3727d25467b2056",
  })(store.getState());
  expect(result.data.reviews[0].comment).toBe("Updated comment!");
  expect(result.data.reviews[1].comment).toBe(review2.comment);
});

test("updateEntity updates a Deal entity in getProductsDeals cache", async () => {
  const store = createTestStore();

  await store.dispatch(productApi.endpoints.getProductsDeals.initiate());

  await store.dispatch(
    updateEntity({
      typeName: "Deal",
      id: "deal001",
      update: (draft) => { draft.dealPrice = 49.99; },
    }),
  );

  const result = productApi.endpoints.getProductsDeals.select(undefined)(store.getState());
  expect(result.data[0].dealPrice).toBe(49.99);
  expect(result.data[1].dealPrice).toBe(deal2.dealPrice);
});

test("getProductsById with relatedProducts tracks nested product in entityMapping", async () => {
  const store = createTestStore();

  // product2 has relatedProducts: [product1]
  await store.dispatch(
    productApi.endpoints.getProductsById.initiate({ id: "69909bf8b3727d25467b2057" }),
  );

  const { entityMapping } = store.getState().api;
  const cacheKey = 'getProductsById({"id":"69909bf8b3727d25467b2057"})';

  expect(entityMapping.Product?.["69909bf8b3727d25467b2057"]?.[cacheKey]).toEqual([["product"]]);
  expect(entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[cacheKey]).toEqual([
    ["product", "relatedProducts", 0],
  ]);
});

test("updateEntity patches entity at relatedProducts path in getProductsById", async () => {
  const store = createTestStore();

  // product2 has relatedProducts: [product1]
  await store.dispatch(
    productApi.endpoints.getProductsById.initiate({ id: "69909bf8b3727d25467b2057" }),
  );

  await store.dispatch(
    updateEntity({
      typeName: "Product",
      id: product1._id,
      update: (draft) => { draft.name = "Updated Nested Product"; },
    }),
  );

  const result = productApi.endpoints.getProductsById.select({
    id: "69909bf8b3727d25467b2057",
  })(store.getState());
  expect(result.data.product.relatedProducts[0].name).toBe("Updated Nested Product");
});

test("updateEntity patches entity at both direct and relatedProducts positions in getProducts", async () => {
  const store = createTestStore();

  // product2.relatedProducts = [product1], so product1 appears at [0] and [1,"relatedProducts",0]
  await store.dispatch(
    productApi.util.upsertQueryData("getProducts", {}, [product1, product2]),
  );

  await store.dispatch(
    updateEntity({
      typeName: "Product",
      id: product1._id,
      update: (draft) => { draft.name = "Updated At All Positions"; },
    }),
  );

  const result = productApi.endpoints.getProducts.select({})(store.getState());
  expect(result.data[0].name).toBe("Updated At All Positions");
  expect(result.data[1].relatedProducts[0].name).toBe("Updated At All Positions");
});

test("upsertQueryData for getProductsSearch populates entityMapping", async () => {
  const store = createTestStore();

  await store.dispatch(
    productApi.util.upsertQueryData("getProductsSearch", { name: "Clutch" }, [product1]),
  );

  const { entityMapping } = store.getState().api;
  const cacheKey = 'getProductsSearch({"name":"Clutch"})';

  expect(entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[cacheKey]).toEqual([[0]]);
});

test("entityMapping is cleaned up when getProductsSearch cache expires", async () => {
  const store = createTestStore();
  const cacheKey = 'getProductsSearch({"name":"Chain Crossbody Clutch"})';

  const sub = store.dispatch(
    productApi.endpoints.getProductsSearch.initiate({ name: "Chain Crossbody Clutch" }),
  );
  await sub;
  expect(
    store.getState().api.entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[cacheKey],
  ).toBeDefined();

  sub.unsubscribe();
  await jest.runAllTimersAsync();

  expect(
    store.getState().api.entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[cacheKey],
  ).toBeUndefined();
});

test("removeQueryResult removes cache key from entityMapping for getProducts", async () => {
  const store = createTestStore();
  const cacheKey = "getProducts({})";

  await store.dispatch(productApi.endpoints.getProducts.initiate({}));

  expect(
    store.getState().api.entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[cacheKey],
  ).toBeDefined();
  expect(
    store.getState().api.entityMapping.Product?.["69909bf8b3727d25467b2057"]?.[cacheKey],
  ).toBeDefined();
  expect(
    store.getState().api.entityMapping.Product?.["69909bf8b3727d25467b2058"]?.[cacheKey],
  ).toBeDefined();

  store.dispatch(
    productApi.internalActions.removeQueryResult({ queryCacheKey: cacheKey }),
  );

  const { entityMapping } = store.getState().api;
  expect(entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[cacheKey]).toBeUndefined();
  expect(entityMapping.Product?.["69909bf8b3727d25467b2057"]?.[cacheKey]).toBeUndefined();
  expect(entityMapping.Product?.["69909bf8b3727d25467b2058"]?.[cacheKey]).toBeUndefined();
});

test("removeQueryResult removes cache key from entityMapping for getProductsSearch", async () => {
  const store = createTestStore();
  const cacheKey = 'getProductsSearch({"name":"Chain Crossbody Clutch"})';

  await store.dispatch(
    productApi.endpoints.getProductsSearch.initiate({ name: "Chain Crossbody Clutch" }),
  );

  expect(
    store.getState().api.entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[cacheKey],
  ).toBeDefined();

  store.dispatch(
    productApi.internalActions.removeQueryResult({ queryCacheKey: cacheKey }),
  );

  const { entityMapping } = store.getState().api;
  expect(entityMapping.Product?.["69909bf8b3727d25467b2056"]?.[cacheKey]).toBeUndefined();
});

test("upsertQueryData with empty array creates no entityMapping entries for getProducts", async () => {
  const store = createTestStore();

  await store.dispatch(productApi.util.upsertQueryData("getProducts", {}, []));

  expect(store.getState().api.entityMapping.Product).toBeUndefined();
});

test("upsertQueryData with empty array creates no entityMapping entries for getProductsDeals", async () => {
  const store = createTestStore();

  await store.dispatch(productApi.util.upsertQueryData("getProductsDeals", undefined, []));

  expect(store.getState().api.entityMapping.Deal).toBeUndefined();
});

test("updateQueryData removing a review from getProductsById updates entityMapping", async () => {
  const store = createTestStore();
  const cacheKey = 'getProductsById({"id":"69909bf8b3727d25467b2056"})';

  await store.dispatch(
    productApi.util.upsertQueryData(
      "getProductsById",
      { id: "69909bf8b3727d25467b2056" },
      { product: product1, reviews: [review1, review2] },
    ),
  );
  expect(store.getState().api.entityMapping.Review?.["review001"]?.[cacheKey]).toBeDefined();
  expect(store.getState().api.entityMapping.Review?.["review002"]?.[cacheKey]).toBeDefined();

  await store.dispatch(
    productApi.util.updateQueryData(
      "getProductsById",
      { id: "69909bf8b3727d25467b2056" },
      () => ({ product: product1, reviews: [review2] }),
    ),
  );

  const { entityMapping } = store.getState().api;
  expect(entityMapping.Review?.["review001"]).toBeUndefined();
  expect(entityMapping.Review?.["review002"]?.[cacheKey]).toEqual([["reviews", 0]]);
});

test("updateQueryData adding a review to getProductsById updates entityMapping", async () => {
  const store = createTestStore();
  const cacheKey = 'getProductsById({"id":"69909bf8b3727d25467b2056"})';

  await store.dispatch(
    productApi.util.upsertQueryData(
      "getProductsById",
      { id: "69909bf8b3727d25467b2056" },
      { product: product1, reviews: [review1] },
    ),
  );
  expect(store.getState().api.entityMapping.Review?.["review002"]).toBeUndefined();

  await store.dispatch(
    productApi.util.updateQueryData(
      "getProductsById",
      { id: "69909bf8b3727d25467b2056" },
      (draft) => { draft.reviews.push(review2); },
    ),
  );

  const { entityMapping } = store.getState().api;
  expect(entityMapping.Review?.["review001"]?.[cacheKey]).toEqual([["reviews", 0]]);
  expect(entityMapping.Review?.["review002"]?.[cacheKey]).toEqual([["reviews", 1]]);
});