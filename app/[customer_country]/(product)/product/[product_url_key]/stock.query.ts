// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import type { create_api } from "@/API/api.context";
import { API_STOCK_ROUTE } from "@/API/api.routes";

type Api = ReturnType<typeof create_api>;

type Stock = { quantity: number; is_in_stock: boolean };

// A dict keyed by SKU, bare or wrapped in { data }.
type StockDict = Record<string, Stock>;
type StockResponse = StockDict | { data?: StockDict };

const stock_dict = (response: StockResponse | undefined): StockDict =>
  (response as { data?: StockDict } | undefined)?.data ?? (response as StockDict | undefined) ?? {};

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
    return stock_dict(response)[options.sku] ?? { quantity: 0, is_in_stock: false };
  },
});

// Keyed on the sku string — React.cache() compares arguments with Object.is, so
// an options object would be a fresh reference at every call site and miss.
const _load_stock = cache(async (api: Api, sku: string) => {
  return api.FETCH_METHOD<StockResponse>(API_STOCK_ROUTE, { querys: { sku } });
});

export const load_stock = (api: Api, options: { sku: string }) =>
  _load_stock(api, options.sku);
// Real-time stock of several SKUs in one call (variants of a configurable product).
// SKUs missing from the response are out of stock.
export const stocks_query = (api: Api, options: { skus: string[] }) => ({
  queryKey: ["stocks", options.skus],
  staleTime: 0,
  refetchOnMount: true,
  queryFn: async (): Promise<Record<string, Stock>> => {
    const [error, response] = await api.FETCH_METHOD<StockResponse>(API_STOCK_ROUTE, {
      querys: { sku: options.skus },
    });
    if (error) throw new Error(error.message);
    return stock_dict(response);
  },
});

export type { Stock };
