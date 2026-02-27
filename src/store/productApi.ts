import { emptySplitApi as api } from "./emptyApi";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<GetProductsApiResponse, GetProductsApiArg>({
      query: (queryArg) => ({
        url: `/products`,
        params: {
          skip: queryArg.skip,
          limit: queryArg.limit,
        },
      }),
    }),
    getProductsDeals: build.query<
      GetProductsDealsApiResponse,
      GetProductsDealsApiArg
    >({
      query: () => ({ url: `/products/deals` }),
    }),
    getProductsSearch: build.query<
      GetProductsSearchApiResponse,
      GetProductsSearchApiArg
    >({
      query: (queryArg) => ({
        url: `/products/search`,
        params: {
          name: queryArg.name,
        },
      }),
    }),
    getProductsById: build.query<
      GetProductsByIdApiResponse,
      GetProductsByIdApiArg
    >({
      query: (queryArg) => ({ url: `/products/${queryArg.id}` }),
    }),
    postProductsByIdReviews: build.mutation<
      PostProductsByIdReviewsApiResponse,
      PostProductsByIdReviewsApiArg
    >({
      query: (queryArg) => ({
        url: `/products/${queryArg.id}/reviews`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as productApi };
export type GetProductsApiResponse =
  /** status 200 List of products */ Product[];
export type GetProductsApiArg = {
  skip?: number;
  limit?: number;
};
export type GetProductsDealsApiResponse =
  /** status 200 List of deals */ Deal[];
export type GetProductsDealsApiArg = void;
export type GetProductsSearchApiResponse =
  /** status 200 Matching products */ Product[];
export type GetProductsSearchApiArg = {
  name: string;
};
export type GetProductsByIdApiResponse =
  /** status 200 Product with reviews */ {
    product?: Product;
    reviews?: Review[];
  };
export type GetProductsByIdApiArg = {
  id: string;
};
export type PostProductsByIdReviewsApiResponse =
  /** status 201 Review created */ Review;
export type PostProductsByIdReviewsApiArg = {
  id: string;
  body: {
    rating: number;
    comment?: string;
  };
};
export type Product = {
  _id: string;
  name: string;
  brand?: string;
  category?: string;
  price: number;
  stock: number;
  description?: string;
  image?: string;
  rating?: number;
  numReviews?: number;
  createdAt?: string;
};
export type Deal = {
  _id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  image: string;
  originalPrice: number;
  discountPercentage: number;
  dealPrice: number;
  stock?: number;
  isActive?: boolean;
};
export type Review = {
  _id: string;
  userId?: {
    _id: string;
    name: string;
  };
  productId: string;
  rating: number;
  comment?: string;
  createdAt?: string;
};
export const {
  useGetProductsQuery,
  useGetProductsDealsQuery,
  useGetProductsSearchQuery,
  useGetProductsByIdQuery,
  usePostProductsByIdReviewsMutation,
} = injectedRtkApi;
