export const product1 = {
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

export const product2 = {
  _id: "69909bf8b3727d25467b2057",
  name: "Slim Leather Bifold Wallet",
  brand: "Fossil",
  category: "accessories",
  price: 49.99,
  stock: 54,
  description: "Minimalist bifold wallet in full-grain leather.",
  image: "/accessories/wallet1.jpg",
  rating: 4.7,
  numReviews: 213,
  createdAt: "2026-03-01T10:22:11.000Z",
  __v: 0,
  relatedProducts: [product1],
};

export const product3 = {
  _id: "69909bf8b3727d25467b2058",
  name: "Canvas Weekender Bag",
  brand: "Herschel",
  category: "bags",
  price: 129.99,
  stock: 15,
  description: "Durable waxed-canvas bag with shoe compartment.",
  image: "/bags/weekender2.jpg",
  rating: 4.5,
  numReviews: 97,
  createdAt: "2026-03-10T08:45:00.000Z",
  __v: 0,
};

export const review1 = {
  _id: "review001",
  userId: { _id: "user001", name: "Alice" },
  productId: "69909bf8b3727d25467b2056",
  rating: 5,
  comment: "Great bag, holds everything!",
  createdAt: "2026-03-01T10:00:00.000Z",
};

export const review2 = {
  _id: "review002",
  userId: { _id: "user002", name: "Bob" },
  productId: "69909bf8b3727d25467b2056",
  rating: 4,
  comment: "Nice quality, a bit small.",
  createdAt: "2026-03-05T14:30:00.000Z",
};

export const deal1 = {
  _id: "deal001",
  name: "Chain Crossbody Clutch — Summer Sale",
  brand: "ALDO",
  category: "bags",
  description: "Summer discount on the iconic chain clutch.",
  image: "/bags/bags8.jpg",
  originalPrice: 79.99,
  discountPercentage: 20,
  dealPrice: 63.99,
  stock: 10,
  isActive: true,
};

export const deal2 = {
  _id: "deal002",
  name: "Canvas Weekender Bag — Clearance",
  brand: "Herschel",
  category: "bags",
  description: "End-of-season clearance on the weekender.",
  image: "/bags/weekender2.jpg",
  originalPrice: 129.99,
  discountPercentage: 30,
  dealPrice: 90.99,
  stock: 5,
  isActive: true,
};
