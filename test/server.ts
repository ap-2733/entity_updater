import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const product1 = {
  _id: "69909bf8b3727d25467b2056",
  name: "Chain Crossbody Clutch",
  brand: "ALDO",
  category: "bags",
  price: 79.99,
  stock: 22,
  description: "Clutch with removable chain strap and glossy enamel body.",
  image: "/bags/bags8.jpg",
  rating: 4.3,
  numReviews: 88,
  createdAt: "2026-02-14T15:59:52.140Z",
  __v: 0,
};

export const server = setupServer(
  http.get("http://localhost:3000/api/products", () => {
    return HttpResponse.json([product1]);
  }),
  http.get(
    "http://localhost:3000/api/products/69909bf8b3727d25467b2056",
    () => {
      return HttpResponse.json({
        product: product1,
        reviews: [],
      });
    },
  ),
  http.get("http://localhost:3000/api/products/search", () => {
    return HttpResponse.json([product1]);
  }),
);
