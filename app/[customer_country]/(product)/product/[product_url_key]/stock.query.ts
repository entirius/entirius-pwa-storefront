// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import { API_STOCK_ROUTE } from "@/API/api.routes";

type Api = { FETCH_METHOD: (path: string, options?: any) => Promise<any> };

type Stock = { quantity: number; is_in_stock: boolean };

export const stock_query = (api: Api, options: { sku: string }) => ({
  queryKey: ["stock", options.sku],
  // Real-time stock is never cached server-side; always re-fetch.
  staleTime: 0,
  refetchOnMount: true,
  queryFn: async (): Promise<Stock> => {
    const [error, response] = await load_stock(api, options);
    if (error) throw new Error(error.message);
    // Response is a dict keyed by SKU: { "<sku>": { quantity, is_in_stock } }.
    // Missing SKU = absent from response.
    const dict = response?.data ?? response ?? {};
    return dict[options.sku] ?? { quantity: 0, is_in_stock: false };
  },
});

// Keyed on the sku string — React.cache() compares arguments with Object.is, so
// an options object would be a fresh reference at every call site and miss.
const _load_stock = cache(async (api: Api, sku: string) => {
  return api.FETCH_METHOD(API_STOCK_ROUTE, { querys: { sku } });
});

export const load_stock = (api: Api, options: { sku: string }) =>
  _load_stock(api, options.sku);

export type { Stock };
