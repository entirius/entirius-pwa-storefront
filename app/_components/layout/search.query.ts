// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { create_api } from "@/API/api.context";
import { API_SEARCH_ROUTE } from "@/API/api.routes";
import { NORM_PRODUCTS_DATA, type Product, type RawProduct } from "@/utils/NORMALIZERS/product.normalizer";

type Api = ReturnType<typeof create_api>;

// Unified-search response as the API sends it: the products are items of `products/`.
type RawSearchResponse = {
  products?: { total?: number; results?: RawProduct[]; has_next_page?: boolean };
  categories?: { results?: unknown[] };
  phrases?: { text: string; type: string }[];
};

// The products are normalized like the catalog's; categories and phrases stay as they come.
export type SearchResponse = Omit<RawSearchResponse, "products"> & {
  products?: Omit<NonNullable<RawSearchResponse["products"]>, "results"> & { results?: Product[] };
};

export const NORM_SEARCH_DATA = (raw: RawSearchResponse | null | undefined): SearchResponse => {
  const { products, ...rest } = raw ?? {};
  return products ? { ...rest, products: { ...products, results: NORM_PRODUCTS_DATA(products.results) } } : rest;
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
