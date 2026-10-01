import { cache } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { API_OMNIBUS_ROUTE } from "@/API/api.routes";
import type { create_api } from "@/API/api.context";

// EU Omnibus directive: next to a reduced price the shop shows the lowest price
// of the 30 days before the reduction. The backend answers a batch of SKUs:
// { [sku]: { currency, omnibus_gross, omnibus_net, status } } — a SKU without
// price history is absent.
//
// One cache entry per SKU (["omnibus", sku]) so any price on any page can ask for
// its own. Pages that know their discounted SKUs prefetch them in one request on
// the server (omnibus_prefetch); anything else is batched in the browser.

type Api = ReturnType<typeof create_api>;

export type Omnibus = { gross: string; currency: string } | null;

function norm_omnibus(entry: unknown): Omnibus {
  const e = (entry ?? {}) as Record<string, unknown>;
  if (typeof e.omnibus_gross !== "string" || !e.omnibus_gross) return null;
  return { gross: e.omnibus_gross, currency: String(e.currency ?? "") };
}

// Raw backend product → does it show a reduced price? Same rule as NORM_PRICE_DATA.
export function is_discounted(price: unknown): boolean {
  if (!price || typeof price !== "object") return false;
  const p = price as Record<string, unknown>;
  return p.is_range
    ? Boolean(p.range_from_special_gross)
    : Boolean(p.has_special_price && p.final_gross);
}

// ------------------------------------------------------------ server
// Keyed on a joined string: cache() compares arguments with Object.is.
const _load_omnibus = cache(async (api: Api, skus_key: string) =>
  api.FETCH_METHOD(API_OMNIBUS_ROUTE, { querys: { sku: skus_key.split("\n") } }),
);

const load_omnibus = (api: Api, skus: string[]) =>
  _load_omnibus(api, [...new Set(skus)].sort().join("\n"));

// PrefetchBoundary entry: one request, then a per-SKU cache entry for each.
export const omnibus_prefetch = (api: Api, skus: string[]) => ({
  queryKey: ["omnibus-batch", [...new Set(skus)].sort()],
  queryFn: async () => {
    const [error, response] = await load_omnibus(api, skus);
    if (error) throw new Error(error.message);
    return response ?? {};
  },
  seed: (result: unknown, query_client: QueryClient) => {
    if (!result) return; // failed prefetch: let the client ask again
    const dict = result as Record<string, unknown>;
    for (const sku of skus) {
      query_client.setQueryData(["omnibus", sku], norm_omnibus(dict[sku]));
    }
  },
});

// ------------------------------------------------------------ client
// SKUs asked for in the same tick go out as one request.
type Waiter = { resolve: (v: Omnibus) => void; reject: (e: Error) => void };
let pending: { api: Api; waiters: Map<string, Waiter[]> } | null = null;

async function flush() {
  const batch = pending!;
  pending = null;
  let error: Error | null = null;
  let dict: Record<string, unknown> = {};
  try {
    const [err, response] = await batch.api.FETCH_METHOD(API_OMNIBUS_ROUTE, {
      querys: { sku: [...batch.waiters.keys()] },
    });
    if (err) error = new Error(err.message);
    else dict = (response ?? {}) as Record<string, unknown>;
  } catch (e) {
    error = e as Error;
  }
  for (const [sku, waiters] of batch.waiters) {
    for (const w of waiters) {
      if (error) w.reject(error);
      else w.resolve(norm_omnibus(dict[sku]));
    }
  }
}

function load_batched(api: Api, sku: string): Promise<Omnibus> {
  return new Promise((resolve, reject) => {
    if (!pending) {
      pending = { api, waiters: new Map() };
      setTimeout(flush, 0);
    }
    const waiters = pending.waiters.get(sku) ?? [];
    waiters.push({ resolve, reject });
    pending.waiters.set(sku, waiters);
  });
}

export const omnibus_query = (api: Api, sku: string) => ({
  queryKey: ["omnibus", sku],
  // Price history moves daily at most.
  staleTime: 10 * 60 * 1000,
  queryFn: () => load_batched(api, sku),
});
