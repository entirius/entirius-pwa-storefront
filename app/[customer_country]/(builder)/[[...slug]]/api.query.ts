// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import { API_CMS_BLOG_POST_ROUTE, API_CMS_STATIC_PAGE_ROUTE, API_PRODUCTS_ROUTE } from "@/API/api.routes";
import type { create_api } from "@/API/api.context";
import type { CmsDocumentContent, CmsPage } from "@/types/cms.types";
import type { BlogPostRaw, ContentDbPage } from "@/types/blog.types";
import type { RawProduct } from "@/utils/NORMALIZERS/product.normalizer";
import { NORM_BLOG_POST_CARD, type BlogPostCard } from "@/utils/NORMALIZERS/blog-post.normalizer";
import { omnibus_prefetch, is_discounted } from "@/lib/omnibus/omnibus.query";
import { aggregate_categories, aggregate_skus } from "./_components/cms-product-aggregation.config";

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

// ------------------------------------------------------------
// What a CMS document's blocks show, read on the server before it renders (cms-data.ts). Each loader is cached per
// request on primitive arguments (React.cache compares with Object.is), so the Omnibus prefetch below and the
// document share one call.
// ------------------------------------------------------------
// Products by url key (`tile-type-b.url_key`), one batch.
const _load_products_by_url_key = cache(async (api: Api, url_keys_key: string) =>
  api.FETCH_METHOD<ProductsResponse>(API_PRODUCTS_ROUTE, {
    querys: { url_key: url_keys_key.split("\n"), include: "full" },
  }),
);

// Raw API rows: an editor may type the key of any language, so the caller matches every key a row has.
export const load_products_by_url_key = async (api: Api, url_keys: string[]) => {
  const [error, response] = await _load_products_by_url_key(api, url_keys.join("\n"));
  if (error) throw new Error(error.message);
  return response?.results ?? [];
};

// Products by SKU (`tile-product.sku`), one batch.
const _load_products_by_sku = cache(async (api: Api, skus_key: string) =>
  api.FETCH_METHOD<ProductsResponse>(API_PRODUCTS_ROUTE, {
    querys: { sku: skus_key.split("\n"), include: "full" },
  }),
);

// Raw API rows (the Omnibus prefetch reads their prices).
export const load_products_by_sku = async (api: Api, skus: string[]) => {
  const [error, response] = await _load_products_by_sku(api, skus.join("\n"));
  if (error) throw new Error(error.message);
  return response?.results ?? [];
};

// The first products of a category (`section-product-slider-category.custom_field`).
export const CMS_CATEGORY_PRODUCTS_LIMIT = 8;

const _load_category_products = cache(async (api: Api, category: string) =>
  api.FETCH_METHOD<ProductsResponse>(API_PRODUCTS_ROUTE, {
    querys: { category, page_size: CMS_CATEGORY_PRODUCTS_LIMIT, include: "full" },
  }),
);

// Raw API rows, like load_products_by_sku.
export const load_category_products = async (api: Api, category: string) => {
  const [error, response] = await _load_category_products(api, category);
  if (error) throw new Error(error.message);
  return response?.results ?? [];
};

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
export async function load_cms_blog_posts(api: Api, routes: string[], language: string): Promise<BlogPostCard[]> {
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
}

// ------------------------------------------------------------
// What a CMS document's browser parts read, for the page's PrefetchBoundary: the Omnibus lines of the reduced prices
// in its product cards, in the server HTML like the catalog's. A failed product request leaves them to the browser.
// ------------------------------------------------------------
export async function cms_content_prefetches(api: Api, content: CmsDocumentContent) {
  const skus = aggregate_skus(content);
  const categories = aggregate_categories(content);
  const rows = await Promise.all([
    skus.length ? load_products_by_sku(api, skus).catch(() => []) : [],
    ...categories.map((category) => load_category_products(api, category).catch(() => [])),
  ]);
  const discounted_skus = rows
    .flat()
    .filter((p) => is_discounted((p as { price?: unknown }).price))
    .map((p) => (p as { sku: string }).sku);
  return discounted_skus.length ? [omnibus_prefetch(api, discounted_skus)] : [];
}
