import { createTestStore } from "./testStore";
import { productApi } from "../src/store/productApi";
import { updateProductEntity } from "../src/store/updaters";

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
