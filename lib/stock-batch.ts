// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { API_STOCK_ROUTE } from "@/API/api.routes";
import type { create_api } from "@/API/api.context";

type Api = ReturnType<typeof create_api>;
type Waiting = { sku: string; resolve: (quantity: number) => void; reject: (e: Error) => void };
type StockBody = { data?: Record<string, { quantity?: number }> } | Record<string, { quantity?: number }> | null;

const BATCH_DELAY_MS = 20;
let queue: Waiting[] = [];

// Tiles ask for the stock of their own SKU; asks made within one tick leave as a single `stock/` call.
// Resolves the available quantity (0 when the SKU is absent from the answer).
export function stock_quantity(api: Api, sku: string): Promise<number> {
  return new Promise((resolve, reject) => {
    queue.push({ sku, resolve, reject });
    if (queue.length > 1) return;
    setTimeout(() => flush(api), BATCH_DELAY_MS);
  });
}

async function flush(api: Api) {
  const batch = queue;
  queue = [];
  const skus = [...new Set(batch.map((w) => w.sku))];
  const [error, response] = await api.FETCH_METHOD(API_STOCK_ROUTE, { querys: { sku: skus } });
  const body = response as StockBody;
  const dict = ((body && "data" in body ? body.data : body) ?? {}) as Record<string, { quantity?: number }>;
  for (const w of batch) {
    if (error) w.reject(new Error(error.message));
    else w.resolve(Number(dict[w.sku]?.quantity ?? 0));
  }
}
