import { cache } from "react";
import { QueryClient } from "@tanstack/react-query";
import { API_CMS_STATIC_PAGE_ROUTE, API_PRODUCTS_ROUTE } from "@/API/api.routes";
import { NORM_PRODUCTS_DATA } from "@/utils/NORMALIZERS/product.normalizer";

type Api = { FETCH_METHOD: (path: string, options?: any) => Promise<any> };

// ------------------------------------------------------------
// CMS static page
// ------------------------------------------------------------
export const load_static_page = cache(async (api: Api, options: { routes: string[] }) => {
  return api.FETCH_METHOD(API_CMS_STATIC_PAGE_ROUTE, {
    querys: { routes: options.routes, limit: 1, page: 1 },
  });
});


export const static_page_query = (api: Api, options: { routes: string[] }) => ({
  queryKey: ["cms-static-page", options.routes],
  queryFn: async () => {
    const [error, response] = await load_static_page(api, options);
    if (error) throw new Error(error.message);
    return response;
  },
});

// ------------------------------------------------------------
// CMS products batch — seeds ["product", url_key] shared with product PDP
// ------------------------------------------------------------
export const cms_products_query = (api: Api, url_keys: string[]) => ({
  queryKey: ["cms-products", url_keys],
  queryFn: async () => {
    const [error, response] = await api.FETCH_METHOD(API_PRODUCTS_ROUTE, {
      querys: { url_key: url_keys, include: "full" },
    });
    if (error) throw new Error(error.message);
    return response;
  },
  seed: (result: any, queryClient: QueryClient) => {
    const products = NORM_PRODUCTS_DATA(result?.results ?? []);
    products.forEach((product: any) => {
      queryClient.setQueryData(
        ["product", product.url_key ?? "no-url-key-error"],
        product,
      );
    });
  },
});
