/* eslint-disable @typescript-eslint/no-explicit-any */
import { entityIdFields } from "./entityIdFields";

export function* walkEntityType(
  typeName: "Product" | "Deal" | "Review",
  id: string,
  queries: Record<string, { endpointName: string; data: any }>,
  callback: (item: any, keyPath: (string | number)[]) => void,
  timeoutMs: number,
): Generator<void> {
  const idField = entityIdFields[typeName];
  let deadline = performance.now() + timeoutMs;
  let counter = 0;
  for (const [queryCacheKey, query] of Object.entries(queries)) {
    if (++counter % 1000 === 0) {
      const now = performance.now();
      if (now > deadline) {
        deadline = now + timeoutMs;
        timeoutMs = yield;
      }
    }
    if (!query.data) continue;
    if (typeName === "Product") {
      if (
        query.endpointName === "getProducts" ||
        query.endpointName === "getProductsSearch"
      ) {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        for (let i0 = 0; i0 < query.data.length; i0++) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          stack.push({
            item: query.data[i0],
            keyPath: [...[queryCacheKey], i0],
          });
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.relatedProducts != null) {
            for (let i0 = 0; i0 < item.relatedProducts.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.relatedProducts[i0],
                keyPath: [...[...keyPath, "relatedProducts"], i0],
              });
            }
          }
        }
      } else if (query.endpointName === "getProductsById") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        if (query.data.product != null) {
          stack.push({
            item: query.data.product,
            keyPath: [...[queryCacheKey], "product"],
          });
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
          if (item.relatedProducts != null) {
            for (let i0 = 0; i0 < item.relatedProducts.length; i0++) {
              if (++counter % 1000 === 0) {
                const now = performance.now();
                if (now > deadline) {
                  deadline = now + timeoutMs;
                  timeoutMs = yield;
                }
              }
              stack.push({
                item: item.relatedProducts[i0],
                keyPath: [...[...keyPath, "relatedProducts"], i0],
              });
            }
          }
        }
      }
    } else if (typeName === "Deal") {
      if (query.endpointName === "getProductsDeals") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        for (let i0 = 0; i0 < query.data.length; i0++) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          stack.push({
            item: query.data[i0],
            keyPath: [...[queryCacheKey], i0],
          });
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
        }
      }
    } else if (typeName === "Review") {
      if (query.endpointName === "getProductsById") {
        const stack: Array<{ item: any; keyPath: (string | number)[] }> = [];
        if (query.data.reviews != null) {
          for (let i0 = 0; i0 < query.data.reviews.length; i0++) {
            if (++counter % 1000 === 0) {
              const now = performance.now();
              if (now > deadline) {
                deadline = now + timeoutMs;
                timeoutMs = yield;
              }
            }
            stack.push({
              item: query.data.reviews[i0],
              keyPath: [...[...[queryCacheKey], "reviews"], i0],
            });
          }
        }
        let stackIdx = 0;
        while (stackIdx < stack.length) {
          if (++counter % 1000 === 0) {
            const now = performance.now();
            if (now > deadline) {
              deadline = now + timeoutMs;
              timeoutMs = yield;
            }
          }
          const { item, keyPath } = stack[stackIdx++];
          if (item[idField] === id) callback(item, keyPath);
        }
      }
    }
  }
}
