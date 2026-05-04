import { walkEntityType } from "../src/store/walkEntityType";
import {
  product1,
  product2,
  product3,
  deal1,
  deal2,
  review1,
  review2,
} from "./mockData";

function drain(gen: Generator<void>): void {
  while (!gen.next().done) {}
}

describe("walkEntityType", () => {
  describe("Product – getProducts / getProductsSearch", () => {
    it("reports matching product with keyPath [cacheKey, index]", () => {
      const cacheKey = 'getProducts({"skip":0})';
      const queries = {
        [cacheKey]: { endpointName: "getProducts", data: [product1, product3] },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Product",
          product1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: product1, keyPath: [cacheKey, 0] }]);
    });

    it("does not report products whose id does not match", () => {
      const cacheKey = "getProducts({})";
      const queries = {
        [cacheKey]: { endpointName: "getProducts", data: [product1, product3] },
      };
      const items: unknown[] = [];

      drain(
        walkEntityType("Product", product1._id, queries, (item) => items.push(item), Infinity),
      );

      expect(items).toEqual([product1]);
    });

    it("getProductsSearch uses the same traversal as getProducts", () => {
      const cacheKey = 'getProductsSearch({"name":"bag"})';
      const queries = {
        [cacheKey]: { endpointName: "getProductsSearch", data: [product3] },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Product",
          product3._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: product3, keyPath: [cacheKey, 0] }]);
    });

    it("finds the same entity at both its direct position and inside relatedProducts", () => {
      const cacheKey = "getProducts({})";
      // data has product1 directly and product2 which contains product1 as a related product
      const queries = {
        [cacheKey]: { endpointName: "getProducts", data: [product1, product2] },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Product",
          product1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([
        { item: product1, keyPath: [cacheKey, 0] },
        { item: product1, keyPath: [cacheKey, 1, "relatedProducts", 0] },
      ]);
    });

    it("finds a product that only appears via relatedProducts", () => {
      const cacheKey = "getProducts({})";
      // product1 is not in the root array but is nested inside product2
      const queries = {
        [cacheKey]: { endpointName: "getProducts", data: [product2] },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Product",
          product1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([
        { item: product1, keyPath: [cacheKey, 0, "relatedProducts", 0] },
      ]);
    });
  });

  describe("Product – getProductsById", () => {
    it("reports the matching product at keyPath [cacheKey, 'product']", () => {
      const cacheKey = 'getProductsById({"id":"abc"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getProductsById",
          data: { product: product1, reviews: [review1] },
        },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Product",
          product1._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: product1, keyPath: [cacheKey, "product"] }]);
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

      drain(walkEntityType("Product", "nonexistent-id", queries, callback, Infinity));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("Deal – getProductsDeals", () => {
    it("reports matching deal with keyPath [cacheKey, index]", () => {
      const cacheKey = "getProductsDeals(undefined)";
      const queries = {
        [cacheKey]: { endpointName: "getProductsDeals", data: [deal1, deal2] },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Deal",
          deal2._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: deal2, keyPath: [cacheKey, 1] }]);
    });
  });

  describe("Review – getProductsById", () => {
    it("reports matching review at keyPath [cacheKey, 'reviews', index]", () => {
      const cacheKey = 'getProductsById({"id":"abc"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getProductsById",
          data: { product: product1, reviews: [review1, review2] },
        },
      };
      const results: { item: unknown; keyPath: (string | number)[] }[] = [];

      drain(
        walkEntityType(
          "Review",
          review2._id,
          queries,
          (item, keyPath) => results.push({ item, keyPath }),
          Infinity,
        ),
      );

      expect(results).toEqual([{ item: review2, keyPath: [cacheKey, "reviews", 1] }]);
    });

    it("does not report products when walking for Review", () => {
      const cacheKey = 'getProductsById({"id":"abc"})';
      const queries = {
        [cacheKey]: {
          endpointName: "getProductsById",
          data: { product: product1, reviews: [review1] },
        },
      };
      const items: unknown[] = [];

      drain(
        walkEntityType("Review", review1._id, queries, (item) => items.push(item), Infinity),
      );

      expect(items).toEqual([review1]);
    });
  });

  describe("multiple cache entries", () => {
    it("finds the same entity in every cache entry that contains it", () => {
      const key1 = 'getProducts({"skip":0})';
      const key2 = 'getProductsSearch({"name":"bag"})';
      const queries = {
        [key1]: { endpointName: "getProducts", data: [product1] },
        [key2]: { endpointName: "getProductsSearch", data: [product1] },
      };
      const keyPaths: (string | number)[][] = [];

      drain(
        walkEntityType("Product", product1._id, queries, (_item, kp) => keyPaths.push(kp), Infinity),
      );

      expect(keyPaths).toEqual([
        [key1, 0],
        [key2, 0],
      ]);
    });
  });

  describe("edge cases", () => {
    it("skips queries with null data", () => {
      const queries = { key: { endpointName: "getProducts", data: null } };
      const callback = jest.fn();

      drain(walkEntityType("Product", product1._id, queries, callback, Infinity));

      expect(callback).not.toHaveBeenCalled();
    });

    it("skips queries whose endpointName does not contain the requested type", () => {
      const queries = { key: { endpointName: "getProductsDeals", data: [deal1] } };
      const callback = jest.fn();

      drain(walkEntityType("Product", product1._id, queries, callback, Infinity));

      expect(callback).not.toHaveBeenCalled();
    });

    it("handles an empty data array", () => {
      const queries = { key: { endpointName: "getProducts", data: [] } };
      const callback = jest.fn();

      drain(walkEntityType("Product", product1._id, queries, callback, Infinity));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("timeout / yield", () => {
    it("completes in a single next() call when timeout is ample", () => {
      const queries = { key: { endpointName: "getProducts", data: [product1] } };
      const gen = walkEntityType("Product", product1._id, queries, jest.fn(), Infinity);

      expect(gen.next().done).toBe(true);
    });

    it("yields (done=false) when performance.now exceeds deadline", () => {
      // 1000 outer-loop iterations advance the counter to 1000, triggering the
      // time check; at that point performance.now() returns 100 > deadline (1).
      const spy = jest.spyOn(performance, "now")
        .mockReturnValueOnce(0)
        .mockReturnValue(100);

      const queries = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [
          `key${i}`,
          { endpointName: "getProducts", data: [] },
        ]),
      );
      const gen = walkEntityType("Product", product1._id, queries, jest.fn(), 1);

      expect(gen.next().done).toBe(false);

      spy.mockRestore();
    });

    it("resumes after yield and completes with the full result", () => {
      // 1000 outer-loop iterations hit the counter check; second
      // performance.now() returns 100 > deadline (1) → yield.  Subsequent
      // calls return 0 so no further yields.  Only key999 has data, so the
      // callback fires exactly once after resume.
      const spy = jest.spyOn(performance, "now")
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(100)
        .mockReturnValue(0);

      const queries = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [
          `key${i}`,
          { endpointName: "getProducts", data: i === 999 ? [product1] : [] },
        ]),
      );
      const found: string[] = [];
      const gen = walkEntityType(
        "Product",
        product1._id,
        queries,
        (item) => found.push(item._id),
        1,
      );

      const r1 = gen.next();
      expect(r1.done).toBe(false);
      expect(found).toHaveLength(0);

      const r2 = gen.next();
      expect(r2.done).toBe(true);
      expect(found).toEqual([product1._id]);

      spy.mockRestore();
    });
  });
});