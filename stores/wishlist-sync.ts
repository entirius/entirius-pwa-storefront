// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import { API_PRODUCTS_ROUTE, API_WISHLIST_PRODUCT_ROUTE, API_WISHLIST_ROUTE } from "@/API/api.routes";
import { NORM_PRODUCTS_DATA, type RawProduct } from "@/utils/NORMALIZERS/product.normalizer";
import { useWishlistStore, type WishlistItem } from "@/stores/wishlist.store";
import { _LOGGER } from "@/lib/logger";

// A signed-in customer's wishlist lives on the account (accounts keeps the SKUs); the local store keeps the
// product snapshots the drawer shows. A guest's wishlist stays local and joins the account at sign-in.

type Items = Record<string, WishlistItem>;
type Api = ReturnType<typeof create_api>;

// The account's SKUs; [] while the customer has none yet (the API answers 400 until the first add).
async function account_skus(api: Api): Promise<string[]> {
  const [error, data] = await api.FETCH_METHOD<{ data?: { products?: { sku: string }[] } }>(API_WISHLIST_ROUTE);
  if (error) {
    if (error.status === 400) return [];
    throw new Error(error.message);
  }
  return (data?.data?.products ?? []).map((p) => p.sku);
}

async function write(api: Api, method: "POST" | "DELETE", skus: string[]) {
  if (!skus.length) return;
  const [error] = await api.FETCH_METHOD(API_WISHLIST_PRODUCT_ROUTE, {
    method,
    body: JSON.stringify({ sku: skus }),
  });
  if (error) throw new Error(error.message);
}

// Snapshots of products the device has not seen, from the catalogue (the account knows only SKUs).
async function snapshots(api: Api, skus: string[]): Promise<Items> {
  if (!skus.length) return {};
  const [error, response] = await api.FETCH_METHOD<{ results?: RawProduct[] }>(API_PRODUCTS_ROUTE, {
    querys: { sku: skus, page_size: skus.length },
  });
  if (error) throw new Error(error.message);
  const items: Items = {};
  for (const p of NORM_PRODUCTS_DATA(response?.results ?? [])) {
    items[p.sku] = {
      sku: p.sku,
      name: p.name,
      url_key: p.url_key,
      price: p.price,
      description: p.description ?? "",
      media: p.media,
    };
  }
  return items;
}

// The list after a sync: the account's SKUs in its order, each with the local snapshot when there is one;
// `keep_local` (sign-in) also keeps what only this device has. A SKU without any snapshot (gone from the
// catalogue) is left out.
export function merge_wishlist(local: Items, account: string[], fetched: Items, keep_local: boolean): Items {
  const merged: Items = {};
  for (const sku of account) {
    const item = local[sku] ?? fetched[sku];
    if (item) merged[sku] = item;
  }
  if (keep_local) for (const [sku, item] of Object.entries(local)) merged[sku] ??= item;
  return merged;
}

async function sync(keep_local: boolean) {
  const api = create_api(make_client_access());
  try {
    const local = useWishlistStore.getState().items;
    const account = await account_skus(api);
    if (keep_local) await write(api, "POST", Object.keys(local).filter((sku) => !account.includes(sku)));
    const fetched = await snapshots(api, account.filter((sku) => !local[sku]));
    useWishlistStore.getState().replace(merge_wishlist(useWishlistStore.getState().items, account, fetched, keep_local));
  } catch (e) {
    _LOGGER({ type: "warning", message: "[wishlist] account sync failed", print: e });
  }
}

// Sign-in: the guest's list joins the account's, and the device shows both.
export const merge_wishlist_on_login = () => sync(true);

// A signed-in page load: the account decides (an item removed on another device goes here too).
export const load_account_wishlist = () => sync(false);

// The heart while signed in: the local list changes at once, the account follows; a refused write is undone.
export async function toggle_on_account(sku: string, item: WishlistItem) {
  const store = useWishlistStore.getState();
  const adding = !store.has(sku);
  store.toggle(sku, item);
  try {
    await write(create_api(make_client_access()), adding ? "POST" : "DELETE", [sku]);
  } catch (e) {
    useWishlistStore.getState().toggle(sku, item);
    _LOGGER({ type: "warning", message: "[wishlist] account write failed", print: e });
  }
}

export async function remove_from_account(sku: string) {
  const item = useWishlistStore.getState().items[sku];
  if (item) await toggle_on_account(sku, item);
}

// Sign-out: the list belongs to the account, not to the device.
export function clear_wishlist_on_logout(): void {
  useWishlistStore.getState().clear();
}
