import { Mapping } from "@/src/store/types";

export const mapping: Mapping = {
  Product: {
    getProducts: [["[]"]],
    getProductsSearch: [["[]"]],
    getProductsById: [["product"]],
  },
  Deal: {
    getProductsDeals: [["[]"]],
  },
  GetProductsByIdApiResponse: {
    getProductsById: [[]],
  },
  Review: {
    getProductsById: [["reviews", "[]"]],
  },
};
