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
import { NORM_PRODUCTS_DATA } from "@/utils/NORMALIZERS/product.normalizer";

type Api = { FETCH_METHOD: (path: string, options?: any) => Promise<any> };

// ------------------------------------------------------------
// ------------------------------------------------------------
// query definition
// ------------------------------------------------------------
// ------------------------------------------------------------
export const catalog_query = (api: Api, options: any) => ({
  queryKey: ["catalog", options],
  queryFn: async () => {
    const [error, response] = await load_catalog(api, options);
    if (error) throw new Error(error.message);
    const { results, has_next_page, page, page_size } = response;
    const products = NORM_PRODUCTS_DATA(results);
    return { data: products, pagination: { has_next_page, page, page_size } };
  },
  seed: (result: any, queryClient: QueryClient) => {
    result.data?.forEach((product: any) => {
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

// The v2 /options/ response is already grouped server-side into
// { sort, ranges, filters }. We map it into the { q_, s_, r_ } prefix shape
// the filter components + store expect, preserving their field names
// (options, min_value, max_value) and ordering everything by `position`.
const by_position = (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0);

const map_filters = (res: any) => {
  const filters = res?.filters ?? [];
  const ranges = res?.ranges ?? [];
  const sort = res?.sort ?? [];

  const q_ = Object.fromEntries(
    [...filters].sort(by_position).map((f: any) => [
      `q_${f.idx}`,
      {
        label: f.label,
        // idx can be boolean (e.g. is_handcrafted); store/URL keys are strings
        options: [...(f.values ?? [])].sort(by_position).map((v: any) => ({
          idx: String(v.idx),
          label: v.label,
        })),
      },
    ]),
  );

  const r_ = Object.fromEntries(
    [...ranges].sort(by_position).map((r: any) => [
      `r_${r.idx}`,
      { label: r.label, min_value: r.min, max_value: r.max },
    ]),
  );

  // All sortable fields wrapped in one group to match SortGroup's shape.
  // The container key (s_order_by) is only a React key — FilterSortItem builds
  // its own s_<idx> key per option.
  const s_ = sort.length
    ? {
        s_order_by: {
          label: "Sort",
          options: [...sort]
            .sort(by_position)
            .map((s: any) => ({ idx: s.idx, label: s.label })),
        },
      }
    : {};

  return { q_, s_, r_ };
};

export const filters_query = (api: Api, options: any) => ({
  queryKey: ["filters", options.category],
  queryFn: async () => {
    const [error, response] = await api.FETCH_METHOD(
      API_CATALOG_FILTERS_ROUTE,
      {
        querys: options,
      },
    );
    if (error) throw new Error(error.message);
    return { data: map_filters(response) };
  },
});

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
  const options = Object.fromEntries(JSON.parse(options_key));
  return api.FETCH_METHOD(API_PRODUCTS_ROUTE, {
    querys: { ...options, include: "full" },
  });
});

export const load_catalog = (api: Api, options: any) =>
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
// Category detail (name/description/breadcrumb `path`) for catalog SEO.
// `categories/?url_key=X` returns `{ results: [category] }` (or a bare array);
// returns the single raw category object, or undefined.
// Keyed on the url_key string, not an options object — generateMetadata and the
// page body each build their own literal, and only a primitive key dedupes them.
const _load_category = cache(async (api: Api, url_key: string) => {
  const [error, response] = await api.FETCH_METHOD(API_CATEGORIES_ROUTE, {
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

export const load_products = async (api: Api, options: any) => {
  const [error, response] = await load_catalog(api, options);
  if (error) return { error, response };
  const { results, has_next_page, page, page_size } = response as {
    results: any;
    has_next_page: boolean;
    page: number;
    page_size: number;
  };
  return { data: results, pagination: { has_next_page, page, page_size } };
};
