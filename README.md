### Updating entities in rtk-query cache

rtk-query is a powerful tool for fetching and caching data.
Its data updating solution is focused on invalidating and refetching data.
If a certain entity (an object uniquely identifiable by its type and id)
is updated, every query that contains it will be invalidated and refetched.
This isn't always what we want. Sometimes we want to update the entity in the cache
without invalidating the queries that contain it. However, this requires manually
keeping track of which queries with which arguments contain the entity.

This repository contains a demo implementation of using openapi schema 
and TypeScript types to automatically find and update queries in the rtk-query cache.

First, we generate a rtk-query api from an openapi schema.
Then we analyze the generated api and find all queries that contain the entity.
From them, we create a mapping file that maps the entity to the queries that contain it:

```typescript
export const mapping: Mapping = {
  Product: {
    getProducts: [["[]"]],
    getProductsSearch: [["[]"]],
    getProductsById: [["product"]],
  }
};
```

We also generate an action creator for each entity:
```typescript
updateProductEntity: AsyncThunk<void, {
  filter: Partial<Product>
  update: Partial<Product>
}>
```
which takes an object with a filter (object with fields that uniquely identify the entity)
and an update (object with fields that should be updated). Dispatching those actions will find
entities in the cache using mapping and update them.

An example can be seen in test/products.test.js. We first dispatch three different queries which all return
the same product. Then we update the product using updateProductEntity and verify that
data of all three queries was updated.