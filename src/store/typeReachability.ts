export const queryMap = {
  getProducts: "Product[]",
  getProductsDeals: "Deal[]",
  getProductsSearch: "Product[]",
  getProductsById: { product: "Product", reviews: "Review[]" },
  Product: { relatedProducts: "Product[]" },
} as const;

export type QueryMap = typeof queryMap;
