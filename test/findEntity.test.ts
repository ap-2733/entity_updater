import { findEntity } from "../src/store/findEntity";
import {
  product1,
  product2,
  product3,
  deal1,
  deal2,
  review1,
  review2,
} from "./mockData";

describe("findEntity", () => {
  describe("Product – getProducts / getProductsSearch", () => {
    it("reports queryCacheKey and keyPath [index] for a matching product", () => {
      const cacheKey = 'getProducts({"skip":0})';
      const queries = {
        [cacheKey]: { endpointName: "getProducts", data: [product1, product3] },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] = [];

      findEntity("Product", product1._id, queries, (queryCacheKey, keyPath) =>
        results.push({ queryCacheKey, keyPath }),
      );

      expect(results).toEqual([{ queryCacheKey: cacheKey, keyPath: [0] }]);
    });

    it("reports only the product whose id matches, not others in the same array", () => {
      const cacheKey = "getProducts({})";
      const queries = {
        [cacheKey]: { endpointName: "getProducts", data: [product1, product3] },
      };
      const callback = jest.fn();

      findEntity("Product", product1._id, queries, callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(cacheKey, [0]);
    });

    it("getProductsSearch uses the same traversal as getProducts", () => {
      const cacheKey = 'getProductsSearch({"name":"bag"})';
      const queries = {
        [cacheKey]: { endpointName: "getProductsSearch", data: [product3] },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] = [];

      findEntity("Product", product3._id, queries, (queryCacheKey, keyPath) =>
        results.push({ queryCacheKey, keyPath }),
      );

      expect(results).toEqual([{ queryCacheKey: cacheKey, keyPath: [0] }]);
    });

    it("finds the entity at its direct position and inside relatedProducts", () => {
      const cacheKey = "getProducts({})";
      const queries = {
        [cacheKey]: { endpointName: "getProducts", data: [product1, product2] },
      };
      const keyPaths: (string | number)[][] = [];

      findEntity("Product", product1._id, queries, (_key, kp) => keyPaths.push(kp));

      expect(keyPaths).toEqual([
        [0],
        [1, "relatedProducts", 0],
      ]);
    });

    it("finds a product that only appears via relatedProducts", () => {
      const cacheKey = "getProducts({})";
      const queries = {
        [cacheKey]: { endpointName: "getProducts", data: [product2] },
      };
      const keyPaths: (string | number)[][] = [];

      findEntity("Product", product1._id, queries, (_key, kp) => keyPaths.push(kp));

      expect(keyPaths).toEqual([[0, "relatedProducts", 0]]);
    });
  });

  describe("Product – getProductsById", () => {
    it("reports keyPath ['product'] for a matching product", () => {
      const cacheKey = 'getProductsById({"id":"abc"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getProductsById",
          data: { product: product1, reviews: [review1] },
        },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] = [];

      findEntity("Product", product1._id, queries, (queryCacheKey, keyPath) =>
        results.push({ queryCacheKey, keyPath }),
      );

      expect(results).toEqual([{ queryCacheKey: cacheKey, keyPath: ["product"] }]);
    });

    it("reports nothing when the product id does not match", () => {
      const cacheKey = 'getProductsById({"id":"abc"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getProductsById",
          data: { product: product1, reviews: [review1] },
        },
      };
      const callback = jest.fn();

      findEntity("Product", "nonexistent-id", queries, callback);

      expect(callback).not.toHaveBeenCalled();
    });

    it("finds a product nested in getProductsById.product.relatedProducts", () => {
      const cacheKey = 'getProductsById({"id":"p2"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getProductsById",
          data: { product: product2, reviews: [] },
        },
      };
      const keyPaths: (string | number)[][] = [];

      findEntity("Product", product1._id, queries, (_key, kp) => keyPaths.push(kp));

      expect(keyPaths).toEqual([["product", "relatedProducts", 0]]);
    });
  });

  describe("Deal – getProductsDeals", () => {
    it("reports queryCacheKey and keyPath [index] for a matching deal", () => {
      const cacheKey = "getProductsDeals(undefined)";
      const queries = {
        [cacheKey]: { endpointName: "getProductsDeals", data: [deal1, deal2] },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] = [];

      findEntity("Deal", deal2._id, queries, (queryCacheKey, keyPath) =>
        results.push({ queryCacheKey, keyPath }),
      );

      expect(results).toEqual([{ queryCacheKey: cacheKey, keyPath: [1] }]);
    });

    it("does not report deals when searching for Product", () => {
      const cacheKey = "getProductsDeals(undefined)";
      const queries = {
        [cacheKey]: { endpointName: "getProductsDeals", data: [deal1, deal2] },
      };
      const callback = jest.fn();

      findEntity("Product", product1._id, queries, callback);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("Review – getProductsById", () => {
    it("reports keyPath ['reviews', index] for a matching review", () => {
      const cacheKey = 'getProductsById({"id":"abc"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getProductsById",
          data: { product: product1, reviews: [review1, review2] },
        },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] = [];

      findEntity("Review", review2._id, queries, (queryCacheKey, keyPath) =>
        results.push({ queryCacheKey, keyPath }),
      );

      expect(results).toEqual([{ queryCacheKey: cacheKey, keyPath: ["reviews", 1] }]);
    });

    it("does not report the product field when searching for Review", () => {
      const cacheKey = 'getProductsById({"id":"abc"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getProductsById",
          data: { product: product1, reviews: [review1] },
        },
      };
      const callback = jest.fn();

      findEntity("Review", review1._id, queries, callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(cacheKey, ["reviews", 0]);
    });
  });

  describe("multiple cache entries", () => {
    it("finds the same entity across all cache entries that contain it", () => {
      const key1 = 'getProducts({"skip":0})';
      const key2 = 'getProductsSearch({"name":"bag"})';
      const queries = {
        [key1]: { endpointName: "getProducts", data: [product1] },
        [key2]: { endpointName: "getProductsSearch", data: [product1] },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] = [];

      findEntity("Product", product1._id, queries, (queryCacheKey, keyPath) =>
        results.push({ queryCacheKey, keyPath }),
      );

      expect(results).toEqual([
        { queryCacheKey: key1, keyPath: [0] },
        { queryCacheKey: key2, keyPath: [0] },
      ]);
    });

    it("reports both the product query and the by-id query", () => {
      const key1 = "getProducts({})";
      const key2 = 'getProductsById({"id":"p1"})';
      const queries = {
        [key1]: { endpointName: "getProducts", data: [product1] },
        [key2]: {
          endpointName: "getProductsById",
          data: { product: product1, reviews: [review1] },
        },
      };
      const results: { queryCacheKey: string; keyPath: (string | number)[] }[] = [];

      findEntity("Product", product1._id, queries, (queryCacheKey, keyPath) =>
        results.push({ queryCacheKey, keyPath }),
      );

      expect(results).toEqual([
        { queryCacheKey: key1, keyPath: [0] },
        { queryCacheKey: key2, keyPath: ["product"] },
      ]);
    });
  });

  describe("edge cases", () => {
    it("skips queries with null data", () => {
      const queries = { key: { endpointName: "getProducts", data: null } };
      const callback = jest.fn();

      findEntity("Product", product1._id, queries, callback);

      expect(callback).not.toHaveBeenCalled();
    });

    it("handles an empty data array", () => {
      const queries = { key: { endpointName: "getProducts", data: [] } };
      const callback = jest.fn();

      findEntity("Product", product1._id, queries, callback);

      expect(callback).not.toHaveBeenCalled();
    });

    it("skips queries with an unknown endpointName", () => {
      const queries = {
        key: { endpointName: "unknownEndpoint", data: [product1] },
      };
      const callback = jest.fn();

      findEntity("Product", product1._id, queries, callback);

      expect(callback).not.toHaveBeenCalled();
    });

    it("handles getProductsById with null product field", () => {
      const cacheKey = 'getProductsById({"id":"abc"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getProductsById",
          data: { product: null, reviews: [] },
        },
      };
      const callback = jest.fn();

      findEntity("Product", product1._id, queries, callback);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});