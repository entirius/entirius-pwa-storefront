// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { create_api } from "@/API/api.context";
import { API_SEARCH_ROUTE } from "@/API/api.routes";
import type { SearchCategory } from "@entirius/storefront-sdk/layout";
import { NORM_PRODUCTS_DATA, type Product, type RawProduct } from "@/utils/NORMALIZERS/product.normalizer";
import { VARIANT_PARAM } from "@/app/[customer_country]/(product)/product/[product_url_key]/_components/variant-selection";

type Api = ReturnType<typeof create_api>;

// Unified-search response as the API sends it: the products are items of `products/`.
type RawSearchResponse = {
  products?: { total?: number; results?: RawProduct[]; has_next_page?: boolean };
  categories?: { results?: SearchCategory[] };
  phrases?: { text: string; type: string }[];
};

// The products are normalized like the catalog's; categories and phrases stay as they come.
export type SearchResponse = Omit<RawSearchResponse, "products"> & {
  products?: Omit<NonNullable<RawSearchResponse["products"]>, "results"> & { results?: (Product & { href: string })[] };
};

// A product's page; a variant hit (no url_key of its own) opens its parent with the variant chosen.
export function product_href(product: Pick<Product, "sku" | "url_key" | "parent_url_key">): string {
  if (product.url_key) return `/product/${product.url_key}`;
  if (!product.parent_url_key) return "#";
  const variant = product.sku ? `?${VARIANT_PARAM}=${encodeURIComponent(product.sku)}` : "";
  return `/product/${product.parent_url_key}${variant}`;
}

export const NORM_SEARCH_DATA = (raw: RawSearchResponse | null | undefined): SearchResponse => {
  const { products, ...rest } = raw ?? {};
  return products
    ? {
        ...rest,
        products: {
          ...products,
          results: NORM_PRODUCTS_DATA(products.results).map((p) => ({ ...p, href: product_href(p) })),
        },
      }
    : rest;
};

// The search endpoint answers from this many characters on.
export const SEARCH_MIN_CHARS = 2;

// The results page of a phrase (app/[customer_country]/search), before the profile prefix.
export const search_path = (q: string) => `/search?q=${encodeURIComponent(q)}`;

export const search_query = (
  api: Api,
  { q, scope = "products,categories" }: { q: string; scope?: string },
) => ({
  queryKey: ["search", q, scope] as const,
  queryFn: async (): Promise<SearchResponse> => {
    // `limit` caps the categories, `page_size` the products: six of each, the rest on the results page.
    const [error, response] = await api.FETCH_METHOD<RawSearchResponse>(API_SEARCH_ROUTE, {
      querys: { q, scope, limit: 6, page_size: 6 },
    });
    if (error) throw new Error(error.message ?? "Search failed");
    return NORM_SEARCH_DATA(response);
  },
});
