// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import {
  API_PRODUCTS_ROUTE,
  API_CATALOG_FILTERS_ROUTE,
  API_CATEGORIES_ROUTE,
} from "@/API/api.routes";
import { QueryClient } from "@tanstack/react-query";
import type { create_api } from "@/API/api.context";
import {
  NORM_PRODUCTS_DATA,
  type Product,
  type RawProduct,
} from "@/utils/NORMALIZERS/product.normalizer";
import { with_stock_first } from "@/lib/stock-sort";

type Api = ReturnType<typeof create_api>;

// The listing's filter, sort and range params as the query string carries them: q_<idx>, s_<idx>, r_<idx>.
export type ListingFilters = Record<`${"q" | "s" | "r"}_${string}`, string | string[]>;

// One page of a listing: a category's or a search phrase's.
export type ListingOptions = ListingFilters & {
  category?: string;
  search?: string;
  page: string;
  page_size: string;
};

// One page of matrix `products/`.
type ProductsPage = {
  results: RawProduct[];
  has_next_page: boolean;
  page: number;
  page_size: number;
};

export type ListingPagination = Omit<ProductsPage, "results">;

export type CatalogPage = { data: Product[]; pagination: ListingPagination };

// ------------------------------------------------------------
// ------------------------------------------------------------
// query definition
// ------------------------------------------------------------
// ------------------------------------------------------------
export const catalog_query = (api: Api, options: ListingOptions) => ({
  queryKey: ["catalog", options],
  queryFn: async (): Promise<CatalogPage> => {
    const [error, response] = await load_catalog(api, options);
    if (error) throw new Error(error.message);
    const { results, has_next_page, page, page_size } = response!;
    const products = NORM_PRODUCTS_DATA(results);
    return { data: products, pagination: { has_next_page, page, page_size } };
  },
  // PrefetchBoundary passes the cached result untyped.
  // `result` is undefined after a failed prefetch: the client listing then shows the error.
  seed: (result: unknown, queryClient: QueryClient) => {
    (result as CatalogPage | undefined)?.data?.forEach((product) => {
      queryClient.setQueryData(
        ["product", product.url_key ?? "no-url-key-error"],
        product,
      );
    });
  },
});

// export const products_query = (api: Api, options: any) => ({
//   queryKey: ["products", options],
//   queryFn: () => load_products(api, options),
//   seed: (result: any, queryClient: QueryClient) => {
//     const products = NORM_PRODUCTS_DATA(result.data ?? []);

//     products.forEach((product: any) => {
//       queryClient.setQueryData(
//         ["product", product.url_key ?? "no-url-key-error"],
//         product,
//       );
//     });
//   },
// });

// The v2 /options/ response.
type OptionsResponse = {
  filters: {
    idx: string;
    label: string;
    position: number;
    values: { idx: string | boolean; label: string; position: number; count: number }[];
  }[];
  ranges: { idx: string; label: string; position: number; min: number | null; max: number | null }[];
  sort: { idx: string; label: string; position: number }[];
};

export type FilterOption = { idx: string; label: string; count: number | null };
export type ValueFilter = { label: string; options: FilterOption[] };
export type RangeFilter = { label: string; min_value: number; max_value: number };
export type SortFilter = { options: { idx: string; label: string }[] };

// What the filter panel renders, keyed by URL param (q_<idx>, r_<idx>).
export type ListingFilterSet = {
  q_: Record<string, ValueFilter>;
  s_: Record<string, SortFilter>;
  r_: Record<string, RangeFilter>;
};

// The v2 /options/ response is already grouped server-side into
// { sort, ranges, filters }. We map it into the { q_, s_, r_ } prefix shape
// the filter components + store expect, preserving their field names
// (options, min_value, max_value) and ordering everything by `position`.
const by_position = (a: { position?: number }, b: { position?: number }) =>
  (a.position ?? 0) - (b.position ?? 0);

// `listing_counts` false: the counts are not the listing's own. /options/ takes no `search`, so on the
// search page they are the whole channel's; only a zero holds for the results too and is kept.
const map_filters = (
  res: OptionsResponse | undefined,
  listing_counts = true,
): ListingFilterSet => {
  const filters = res?.filters ?? [];
  const ranges = res?.ranges ?? [];
  const sort = res?.sort ?? [];

  const q_ = Object.fromEntries(
    [...filters].sort(by_position).map((f) => [
      `q_${f.idx}`,
      {
        label: f.label,
        // idx can be boolean (e.g. is_handcrafted); store/URL keys are strings
        options: [...(f.values ?? [])].sort(by_position).map((v) => ({
          idx: String(v.idx),
          label: v.label,
          // Products in the current listing with this value; null when unknown.
          count: typeof v.count === "number" && (listing_counts || v.count === 0) ? v.count : null,
        })),
      },
    ]),
  );

  // A range without bounds (no product with a value) has nothing to slide over.
  const r_ = Object.fromEntries(
    [...ranges].sort(by_position).flatMap((r) =>
      r.min == null || r.max == null
        ? []
        : [[`r_${r.idx}`, { label: r.label, min_value: r.min, max_value: r.max }]],
    ),
  );

  // All sortable fields wrapped in one group to match SortGroup's shape.
  // The container key (s_order_by) is only a React key — FilterSortItem builds
  // its own s_<idx> key per option.
  const s_: Record<string, SortFilter> = sort.length
    ? {
        s_order_by: {
          options: [...sort]
            .sort(by_position)
            .map((s) => ({ idx: s.idx, label: s.label })),
        },
      }
    : {};

  return { q_, s_, r_ };
};

// Partial: the product page asks with a category alone.
export const filters_query = (api: Api, options: Partial<ListingOptions>) => ({
  queryKey: ["filters", options.category, Boolean(options.search)],
  queryFn: async () => {
    const [error, response] = await api.FETCH_METHOD<OptionsResponse>(
      API_CATALOG_FILTERS_ROUTE,
      {
        querys: options,
      },
    );
    if (error) throw new Error(error.message);
    return { data: map_filters(response, !options.search) };
  },
});

// The listing's filters from the page's query string: q_/s_/r_ params go to the backend as-is (prefix
// kept) — the v2 backend parses them directly, so no strip/nest is needed anymore.
export const listing_filters = (
  search_params: Record<string, string | string[] | undefined>,
): ListingFilters =>
  Object.fromEntries(
    Object.entries(search_params).filter(
      (entry): entry is [string, string | string[]] =>
        ["q_", "s_", "r_"].some((p) => entry[0].startsWith(p)) && entry[1] !== undefined,
    ),
  );

// ------------------------------------------------------------
// ------------------------------------------------------------
// loader/fetcher function
// ------------------------------------------------------------
// ------------------------------------------------------------
// React.cache() compares arguments with Object.is, so an options object is a
// fresh reference at every call site and never hits. Serializing it with sorted
// keys turns the cache key into a primitive, which makes the dedup hold no
// matter how many places ask for the same page of the same catalog.
const stable_key = (options: Record<string, unknown>) =>
  JSON.stringify(Object.keys(options).sort().map((k) => [k, options[k]]));

const _load_catalog = cache(async (api: Api, options_key: string) => {
  if (!api) throw new Error("API instance is not found");
  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // WARNING!!!
  // options passed should by converted to querys to work with the api.setup.ts
  // and auto convert to query string
  // f.e.
  // ?category=catalog_url_key&page_size=16&page=1
  // use on FETCH_METHOD as second parameter
  // ------------------------------------------------------------
  const options: Record<string, unknown> = Object.fromEntries(
    JSON.parse(options_key) as [string, unknown][],
  );
  return api.FETCH_METHOD<ProductsPage>(API_PRODUCTS_ROUTE, {
    querys: { ...with_stock_first(options), include: "full" },
  });
});

export const load_catalog = (api: Api, options: ListingOptions) =>
  _load_catalog(api, stable_key(options));

// ------------------------------------------------------------
// ------------------------------------------------------------
// load products
// Thin wrapper over load_catalog — it carries no cache() of its own, so the
// dedup comes entirely from load_catalog's primitive key. Calling both for the
// same options costs one request.
// ------------------------------------------------------------
// ------------------------------------------------------------
// WARNING: DO NOT DUPLICATE the API instance passed to load_catalog and
// load_products. The cache key is (api, stable_key(options)) — a second
// create_api() is a different reference, so it misses the cache and fires a
// second request. F.e.
// const api_access_context = create_api(await make_server_access());
// const api_access_context_2 = create_api(await make_server_access());
// load_catalog(api_access_context, options);
// load_products(api_access_context_2, options);  // <- extra network call
// Use get_server_api() (lib/seo/server-api.ts) to get the one per-request
// instance rather than constructing your own.
// ------------------------------------------------------------
// ------------------------------------------------------------
// A category of matrix `categories/`: the fields the catalog page reads (the SEO builders pick theirs by config).
export type RawCategory = {
  name?: string;
  url_key?: string;
  description?: string | null;
  breadcrumbs?: { name?: string; url_key?: string }[];
  children?: { name?: string; url_key?: string }[];
};

// Category detail (name/description/breadcrumb `path`) for catalog SEO.
// `categories/?url_key=X` returns `{ results: [category] }` (or a bare array);
// returns the single raw category object, or undefined.
// Keyed on the url_key string, not an options object — generateMetadata and the
// page body each build their own literal, and only a primitive key dedupes them.
const _load_category = cache(async (api: Api, url_key: string) => {
  const [error, response] = await api.FETCH_METHOD<
    RawCategory[] | { results?: RawCategory[]; data?: RawCategory[] }
  >(API_CATEGORIES_ROUTE, {
    querys: { url_key },
  });
  if (error) return undefined;
  const rows = Array.isArray(response)
    ? response
    : (response?.results ?? response?.data ?? []);
  return rows?.[0];
});

export const load_category = (api: Api, options: { url_key: string }) =>
  _load_category(api, options.url_key);

export const load_products = async (api: Api, options: ListingOptions) => {
  const [error, response] = await load_catalog(api, options);
  if (error) return { error, response };
  const { results, has_next_page, page, page_size } = response!;
  return { data: results, pagination: { has_next_page, page, page_size } };
};
