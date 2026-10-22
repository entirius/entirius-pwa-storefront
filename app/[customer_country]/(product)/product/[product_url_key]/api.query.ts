// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import type { create_api } from "@/API/api.context";
import { API_PRODUCTS_ROUTE, API_PRODUCT_VARIANTS_ROUTE } from "@/API/api.routes";
import { NORM_PRODUCTS_DATA, type RawProduct } from "@/utils/NORMALIZERS/product.normalizer";
import { NORM_VARIANTS_DATA, type VariantsData } from "@/utils/NORMALIZERS/variant.normalizer";

type Api = ReturnType<typeof create_api>;

// Shape of the products endpoint payload that this query actually reads.
type ProductsResponse = { results?: RawProduct[] };
type VariantsResponse = Parameters<typeof NORM_VARIANTS_DATA>[0];
type VariantDetailsResponse = { results?: Parameters<typeof NORM_VARIANTS_DATA>[1] };

// `preloaded` lets a Server Component hand over a response it already awaited
// (see page.tsx) so the prefetch does not re-enter the loader at all. Client
// callers omit it and go through load_product as usual.
export const product_query = (
  api: Api,
  options: { product_url_key: string },
  preloaded?: ProductsResponse,
) => ({
  queryKey: ["product", options.product_url_key],
  queryFn: async () => {
    const [error, response] = preloaded
      ? ([null, preloaded] as const)
      : await load_product(api, options);
    if (error) throw new Error(error.message);
    const products = NORM_PRODUCTS_DATA(response?.results ?? []);
    return products[0] ?? null;
  },
});

// React.cache() compares arguments with Object.is, so an object literal built at
// the call site is a fresh reference every time and never hits. Keying on the
// url_key string is what actually lets generateMetadata, the JSON-LD pass and
// the prefetch share a single fetch.
const _load_product = cache(async (api: Api, product_url_key: string) => {
  return api.FETCH_METHOD<ProductsResponse>(API_PRODUCTS_ROUTE, {
    querys: { url_key: product_url_key, include: "full" },
  });
});

export const load_product = (api: Api, options: { product_url_key: string }) =>
  _load_product(api, options.product_url_key);
// Matrix product list page size is capped at 100 by the backend.
const MAX_VARIANTS = 100;

// Variants of a configurable product: axes, options and per-variant price / pictures / stock flag.
// null for every other product type. Runs after load_product (deduplicated by cache()), then needs
// two calls: the variants endpoint has no price or pictures, so the variant SKUs are looked up in
// the product list.
export const variants_query = (api: Api, options: { product_url_key: string }) => ({
  queryKey: ["product-variants", options.product_url_key],
  queryFn: async (): Promise<VariantsData | null> => {
    const [product_error, product_response] = await load_product(api, options);
    if (product_error) throw new Error(product_error.message);
    if (product_response?.results?.[0]?.product_type !== "CONFIGURABLE") return null;

    const [error, response] = await load_variants(api, options);
    if (error) throw new Error(error.message);
    const skus: string[] = (response?.data?.products ?? [])
      .map((p: { sku: string }) => p.sku)
      .slice(0, MAX_VARIANTS);
    if (!skus.length) return NORM_VARIANTS_DATA(response ?? {}, []);

    const [details_error, details] = await load_variant_details(api, { skus });
    if (details_error) throw new Error(details_error.message);
    return NORM_VARIANTS_DATA(response ?? {}, details?.results ?? []);
  },
});

// cache() keys on primitives (Object.is): an options object would never hit.
const _load_variants = cache(async (api: Api, product_url_key: string) => {
  const path = API_PRODUCT_VARIANTS_ROUTE.replace("__URL_KEY__", encodeURIComponent(product_url_key));
  return api.FETCH_METHOD<VariantsResponse>(path);
});

export const load_variants = (api: Api, options: { product_url_key: string }) =>
  _load_variants(api, options.product_url_key);

const load_variant_details = async (api: Api, options: { skus: string[] }) => {
  return api.FETCH_METHOD<VariantDetailsResponse>(API_PRODUCTS_ROUTE, {
    querys: { sku: options.skus, include: "content", page_size: options.skus.length },
  });
};
