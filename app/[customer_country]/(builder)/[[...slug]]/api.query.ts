// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import { QueryClient } from "@tanstack/react-query";
import { API_CMS_BLOG_POST_ROUTE, API_CMS_STATIC_PAGE_ROUTE, API_PRODUCTS_ROUTE } from "@/API/api.routes";
import type { create_api } from "@/API/api.context";
import type { CmsDocumentContent, CmsPage } from "@/types/cms.types";
import type { BlogPostRaw, ContentDbPage } from "@/types/blog.types";
import { NORM_PRODUCTS_DATA, type RawProduct } from "@/utils/NORMALIZERS/product.normalizer";
import { NORM_BLOG_POST_CARD, type BlogPostCard } from "@/utils/NORMALIZERS/blog-post.normalizer";
import { omnibus_prefetch, is_discounted } from "@/lib/omnibus/omnibus.query";
import { link_keys, url_key_query } from "@/lib/url-keys";
import {
  aggregate_categories,
  aggregate_skus,
  aggregate_url_keys,
} from "./_components/cms-product-aggregation.config";

type Api = ReturnType<typeof create_api>;

// Answer of matrix `products/`.
export type ProductsResponse = { results?: RawProduct[] };

// ------------------------------------------------------------
// CMS static page
// ------------------------------------------------------------
// Keyed on a joined string — React.cache() compares arguments with Object.is, so
// both the options object and the routes array inside it would be fresh
// references at every call site and never hit.
// The same route can hold one draft per language: fetch them all, the caller picks one.
const _load_static_page = cache(async (api: Api, routes_key: string) => {
  return api.FETCH_METHOD<{ data: CmsPage[] }>(API_CMS_STATIC_PAGE_ROUTE, {
    querys: { routes: routes_key.split(","), limit: 50, page: 1 },
  });
});

export const load_static_page = (api: Api, options: { routes: string[] }) =>
  _load_static_page(api, options.routes.join(","));

// The page in the given language; a page in another language when there is none (like layout slots).
export function pick_static_page(pages: CmsPage[] | undefined, language: string): CmsPage | null {
  const own = pages?.find((p) => p.language?.toLowerCase() === language.toLowerCase());
  return own ?? pages?.[0] ?? null;
}

export const static_page_query = (
  api: Api,
  options: { routes: string[]; language: string },
) => ({
  queryKey: ["cms-static-page", options.routes, options.language],
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
    const [error, response] = await api.FETCH_METHOD<ProductsResponse>(API_PRODUCTS_ROUTE, {
      querys: { url_key: url_keys, include: "full" },
    });
    if (error) throw new Error(error.message);
    return response;
  },
  seed: (result: unknown, queryClient: QueryClient) => {
    const products = NORM_PRODUCTS_DATA((result as ProductsResponse | undefined)?.results ?? []);
    products.forEach((product) => {
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
export type CmsProduct = ReturnType<typeof NORM_PRODUCTS_DATA>[number];

const products_of = (response: ProductsResponse | undefined): CmsProduct[] =>
  NORM_PRODUCTS_DATA(response?.results ?? []);

export const cms_product_sku_key = (sku: string) => ["cms-product-sku", sku] as const;

// Cached per request on a joined key (React.cache compares with Object.is), so
// the page's Omnibus lookup and the prefetch share one call.
const _load_products_by_sku = cache(async (api: Api, skus_key: string) =>
  api.FETCH_METHOD<ProductsResponse>(API_PRODUCTS_ROUTE, {
    querys: { sku: skus_key.split("\n"), include: "full" },
  }),
);

export const load_products_by_sku = async (api: Api, skus: string[]) => {
  const [error, response] = await _load_products_by_sku(api, skus.join("\n"));
  if (error) throw new Error(error.message);
  return response;
};

export const cms_products_by_sku_query = (api: Api, skus: string[]) => ({
  queryKey: ["cms-products-sku", skus],
  queryFn: () => load_products_by_sku(api, skus),
  seed: (result: unknown, queryClient: QueryClient) => {
    products_of(result as ProductsResponse | undefined).forEach((product) => {
      queryClient.setQueryData(cms_product_sku_key(product.sku), product);
    });
  },
});

export const cms_product_by_sku_query = (api: Api, sku: string) => ({
  queryKey: cms_product_sku_key(sku),
  queryFn: async (): Promise<CmsProduct | null> => {
    const [error, response] = await api.FETCH_METHOD<ProductsResponse>(API_PRODUCTS_ROUTE, {
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
  api.FETCH_METHOD<ProductsResponse>(API_PRODUCTS_ROUTE, {
    querys: { category, page_size: CMS_CATEGORY_PRODUCTS_LIMIT, include: "full" },
  }),
);

// Raw API rows (the page reads their prices for Omnibus); the query normalizes.
export const load_category_products = async (api: Api, category: string) => {
  const [error, response] = await _load_category_products(api, category);
  if (error) throw new Error(error.message);
  return response?.results ?? [];
};

export const cms_category_products_query = (api: Api, category: string) => ({
  queryKey: ["cms-category-products", category],
  queryFn: async (): Promise<CmsProduct[]> =>
    NORM_PRODUCTS_DATA(await load_category_products(api, category)),
});

// ------------------------------------------------------------
// CMS blog posts (`section-blog.blog_section`: up to three post routes the editor picked, `[{ label: route }]`)
// ------------------------------------------------------------
export function blog_section_routes(blog_section: unknown): string[] {
  const rows = Array.isArray(blog_section) ? (blog_section as { label?: unknown }[]) : [];
  const routes = rows.map((row) => (typeof row?.label === "string" ? row.label.trim().replace(/^\/+|\/+$/g, "") : ""));
  // An editor may paste the post's address: its last segment is the route.
  return [...new Set(routes.map((route) => route.split("/").pop() ?? "").filter(Boolean))];
}

// One request per route (an unknown route fails the whole `routes=` filter): the post in the page language, else in
// another one, in the editor's order; a missing post is left out.
export const cms_blog_posts_query = (api: Api, routes: string[], language: string) => ({
  queryKey: ["cms-blog-posts", routes, language],
  queryFn: async (): Promise<BlogPostCard[]> => {
    const versions = await Promise.all(
      routes.map(async (route) => {
        const [error, answer] = await api.FETCH_METHOD<ContentDbPage<BlogPostRaw>>(API_CMS_BLOG_POST_ROUTE, {
          querys: { routes: route, limit: 50, page: 1 },
        });
        return error ? [] : (answer?.data ?? []);
      }),
    );
    return versions.flatMap((rows) => {
      const post = rows.find((row) => row.language?.toLowerCase() === language) ?? rows[0];
      const card = post ? NORM_BLOG_POST_CARD(post) : null;
      return card?.slug ? [card] : [];
    });
  },
});

// ------------------------------------------------------------
// Everything a CMS document's sections read on the client, for the page's PrefetchBoundary: products by url key,
// by SKU and of a category, button links in the active language's url keys, and the Omnibus lines of the reduced
// prices, the posts of blog sections. The product requests are the cached ones the prefetches make; a failed one
// leaves its section to the client.
// ------------------------------------------------------------
export async function cms_content_prefetches(api: Api, content: CmsDocumentContent, language: string) {
  const url_keys = aggregate_url_keys(content);
  const skus = aggregate_skus(content);
  const categories = aggregate_categories(content);
  const blog_sections = Object.values(content.sections ?? {})
    .filter((section) => section.core_type === "section-blog")
    .map((section) => blog_section_routes(section.blog_section))
    .filter((routes) => routes.length);

  // Omnibus lines for the reduced prices in CMS product sections, in the server HTML like the catalog's.
  const cms_products = await Promise.all([
    skus.length
      ? load_products_by_sku(api, skus).then((r) => r?.results ?? []).catch(() => [])
      : [],
    ...categories.map((category) => load_category_products(api, category).catch(() => [])),
  ]);
  const discounted_skus = cms_products
    .flat()
    .filter((p) => is_discounted((p as { price?: unknown }).price))
    .map((p) => (p as { sku: string }).sku);

  return [
    ...(url_keys.length ? [cms_products_query(api, url_keys)] : []),
    ...(skus.length ? [cms_products_by_sku_query(api, skus)] : []),
    ...categories.map((category) => cms_category_products_query(api, category)),
    ...link_keys(content).map(({ kind, key }) => url_key_query(api, language, kind, key)),
    ...(discounted_skus.length ? [omnibus_prefetch(api, discounted_skus)] : []),
    ...blog_sections.map((routes) => cms_blog_posts_query(api, routes, language)),
  ];
}
