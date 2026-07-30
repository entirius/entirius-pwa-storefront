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

export const load_stock = cache(async (api: Api, options: { sku: string }) => {
  return api.FETCH_METHOD(API_STOCK_ROUTE, { querys: { sku: options.sku } });
});

export type { Stock };
