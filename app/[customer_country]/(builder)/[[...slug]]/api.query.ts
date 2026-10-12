// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import { QueryClient } from "@tanstack/react-query";
import { API_CMS_STATIC_PAGE_ROUTE, API_PRODUCTS_ROUTE } from "@/API/api.routes";
import { NORM_PRODUCTS_DATA } from "@/utils/NORMALIZERS/product.normalizer";

type Api = { FETCH_METHOD: (path: string, options?: any) => Promise<any> };

// ------------------------------------------------------------
// CMS static page
// ------------------------------------------------------------
// Keyed on a joined string — React.cache() compares arguments with Object.is, so
// both the options object and the routes array inside it would be fresh
// references at every call site and never hit.
const _load_static_page = cache(async (api: Api, routes_key: string) => {
  return api.FETCH_METHOD(API_CMS_STATIC_PAGE_ROUTE, {
    querys: { routes: routes_key.split(","), limit: 1, page: 1 },
  });
});

export const load_static_page = (api: Api, options: { routes: string[] }) =>
  _load_static_page(api, options.routes.join(","));


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

// ------------------------------------------------------------
// CMS products by SKU (`tile-product.sku`) — one batch request; seeds
// ["cms-product-sku", sku] for each tile.
// ------------------------------------------------------------
type ProductsResponse = { results?: unknown[] } | undefined;
export type CmsProduct = ReturnType<typeof NORM_PRODUCTS_DATA>[number];

const products_of = (response: ProductsResponse): CmsProduct[] =>
  NORM_PRODUCTS_DATA(response?.results ?? []);

export const cms_product_sku_key = (sku: string) => ["cms-product-sku", sku] as const;

// Cached per request on a joined key (React.cache compares with Object.is), so
// the page's Omnibus lookup and the prefetch share one call.
const _load_products_by_sku = cache(async (api: Api, skus_key: string) =>
  api.FETCH_METHOD(API_PRODUCTS_ROUTE, {
    querys: { sku: skus_key.split("\n"), include: "full" },
  }),
);

export const load_products_by_sku = async (api: Api, skus: string[]) => {
  const [error, response] = await _load_products_by_sku(api, skus.join("\n"));
  if (error) throw new Error(error.message);
  return response as ProductsResponse;
};

export const cms_products_by_sku_query = (api: Api, skus: string[]) => ({
  queryKey: ["cms-products-sku", skus],
  queryFn: () => load_products_by_sku(api, skus),
  seed: (result: unknown, queryClient: QueryClient) => {
    products_of(result as ProductsResponse).forEach((product) => {
      queryClient.setQueryData(cms_product_sku_key(product.sku), product);
    });
  },
});

export const cms_product_by_sku_query = (api: Api, sku: string) => ({
  queryKey: cms_product_sku_key(sku),
  queryFn: async (): Promise<CmsProduct | null> => {
    const [error, response] = await api.FETCH_METHOD(API_PRODUCTS_ROUTE, {
      querys: { sku, include: "full" },
    });
    if (error) throw new Error(error.message);
    return products_of(response)[0] ?? null;
  },
});

// ------------------------------------------------------------
// CMS products of a category (`section-product-slider-category.custom_field`)
// ------------------------------------------------------------
export const CMS_CATEGORY_PRODUCTS_LIMIT = 8;

const _load_category_products = cache(async (api: Api, category: string) =>
  api.FETCH_METHOD(API_PRODUCTS_ROUTE, {
    querys: { category, page_size: CMS_CATEGORY_PRODUCTS_LIMIT, include: "full" },
  }),
);

// Raw API rows (the page reads their prices for Omnibus); the query normalizes.
export const load_category_products = async (api: Api, category: string) => {
  const [error, response] = await _load_category_products(api, category);
  if (error) throw new Error(error.message);
  return (response as ProductsResponse)?.results ?? [];
};

export const cms_category_products_query = (api: Api, category: string) => ({
  queryKey: ["cms-category-products", category],
  queryFn: async (): Promise<CmsProduct[]> =>
    NORM_PRODUCTS_DATA(await load_category_products(api, category)),
});
