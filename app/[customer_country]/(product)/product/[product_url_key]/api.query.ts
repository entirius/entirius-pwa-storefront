import { cache } from "react";
import { API_PRODUCTS_ROUTE } from "@/API/api.routes";
import { NORM_PRODUCTS_DATA } from "@/utils/NORMALIZERS/product.normalizer";

type Api = { FETCH_METHOD: (path: string, options?: any) => Promise<any> };

export const product_query = (api: Api, options: { product_url_key: string }) => ({
  queryKey: ["product", options.product_url_key],
  queryFn: async () => {
    const [error, response] = await load_product(api, options);
    if (error) throw new Error(error.message);
    const products = NORM_PRODUCTS_DATA(response?.results ?? []);
    return products[0] ?? null;
  },
});

export const load_product = cache(async (api: Api, options: { product_url_key: string }) => {
  return api.FETCH_METHOD(API_PRODUCTS_ROUTE, {
    querys: { url_key: options.product_url_key, include: "full" },
  });
});
