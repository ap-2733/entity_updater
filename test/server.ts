import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import {
  deal1,
  deal2,
  product1,
  product2,
  product3,
  review1,
  review2,
} from "@/test/mockData";

export const server = setupServer(
  http.get("http://localhost:3000/api/products", () => {
    return HttpResponse.json([product1, product2, product3]);
  }),
  http.get("http://localhost:3000/api/products/deals", () => {
    return HttpResponse.json([deal1, deal2]);
  }),
  http.get(
    "http://localhost:3000/api/products/69909bf8b3727d25467b2056",
    () => {
      return HttpResponse.json({
        product: product1,
        reviews: [review1, review2],
      });
    },
  ),
  http.get(
    "http://localhost:3000/api/products/69909bf8b3727d25467b2057",
    () => {
      return HttpResponse.json({
        product: product2,
        reviews: [],
      });
    },
  ),
  http.get(
    "http://localhost:3000/api/products/69909bf8b3727d25467b2058",
    () => {
      return HttpResponse.json({
        product: product3,
        reviews: [],
      });
    },
  ),
  http.get("http://localhost:3000/api/products/search", () => {
    return HttpResponse.json([product1]);
  }),
);
