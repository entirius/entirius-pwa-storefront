// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import { API_PRODUCTS_ROUTE } from "@/API/api.routes";
import { NORM_PRODUCTS_DATA } from "@/utils/NORMALIZERS/product.normalizer";

type Api = { FETCH_METHOD: (path: string, options?: any) => Promise<any> };

// Shape of the products endpoint payload that this query actually reads.
type ProductsResponse = { results?: unknown[] };

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
      ? [null, preloaded]
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
  return api.FETCH_METHOD(API_PRODUCTS_ROUTE, {
    querys: { url_key: product_url_key, include: "full" },
  });
});

export const load_product = (api: Api, options: { product_url_key: string }) =>
  _load_product(api, options.product_url_key);
