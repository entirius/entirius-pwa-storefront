// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import { API_CART_LATEST_ROUTE, API_CART_ROUTE, API_PRODUCTS_ROUTE } from "@/API/api.routes";
import { NORM_PRODUCTS_DATA } from "@/utils/NORMALIZERS/product.normalizer";
import { useCartStore, type CartItem } from "@/stores/cart.store";
import { _LOGGER } from "@/lib/logger";

type ServerLine = { sku: string; quantity: number };

// The local cart plus the lines of the customer's saved cart; a SKU in both gets the sum of the
// quantities (the backend merge's "add"). Lines whose product is unknown (no longer sold) are left out.
export function merge_cart_items(
  local: Record<string, CartItem>,
  server: ServerLine[],
  products: Record<string, Omit<CartItem, "quantity">>,
): Record<string, CartItem> {
  const merged = { ...local };
  for (const line of server) {
    if (line.quantity <= 0) continue;
    const existing = merged[line.sku];
    if (existing) {
      merged[line.sku] = { ...existing, quantity: existing.quantity + line.quantity };
    } else if (products[line.sku]) {
      merged[line.sku] = { ...products[line.sku], quantity: line.quantity };
    }
  }
  return merged;
}

// Right after login, before the app flips to logged in. The local cart is the source of truth and
// the backend cart its projection, so the merge happens here, not in carts/{id}/merge/ (that one
// only takes an unbound guest cart, and the guest projection may be older than the local cart):
// - the customer has a saved cart → its lines join the local cart, `cid` becomes that cart and the
//   guest cart is closed; the next sync PATCHes the merged list into the customer's cart;
// - no saved cart → the guest cart is closed and `cid` cleared, so the next sync POSTs a new cart
//   with the token, which makes it the customer's (a PATCH with a token does not bind a guest cart).
// Failures are logged and leave the cart as it was: login must not fail because of the cart.
export async function merge_cart_on_login(): Promise<void> {
  const access = make_client_access();
  const api = create_api(access);
  const guest_cid = access.get("cid");

  try {
    const [error, latest] = await api.FETCH_METHOD<{ cart_id?: string; items?: ServerLine[] }>(
      API_CART_LATEST_ROUTE,
    );
    if (error && error.status !== 404) throw new Error(error.message);
    const customer_cid = error ? null : (latest?.cart_id ?? null);

    // Same cart (logged in again on this device): the local cart already mirrors it.
    if (customer_cid && customer_cid === guest_cid) return;

    if (customer_cid) {
      const lines = (latest?.items ?? []).map(({ sku, quantity }) => ({ sku, quantity }));
      const local = useCartStore.getState().items;
      const missing = lines.map((l) => l.sku).filter((sku) => !local[sku]);
      const products: Record<string, Omit<CartItem, "quantity">> = {};
      if (missing.length) {
        const [products_error, response] = await api.FETCH_METHOD<{ results?: unknown[] }>(
          API_PRODUCTS_ROUTE,
          { querys: { sku: missing, page_size: missing.length } },
        );
        if (products_error) throw new Error(products_error.message);
        for (const p of NORM_PRODUCTS_DATA(response?.results ?? [])) {
          products[p.sku] = { sku: p.sku, name: p.name, url_key: p.url_key, price: p.price, media: p.media };
        }
      }
      useCartStore.setState({ items: merge_cart_items(local, lines, products) });
    }

    if (guest_cid) await api.FETCH_METHOD(API_CART_ROUTE, { method: "DELETE" });
    if (customer_cid) access.set?.("cid", customer_cid);
    else access.delete?.("cid");
  } catch (e) {
    _LOGGER({ type: "warning", message: "[cart] merge on login failed", print: e });
  }
}

// On logout the cart stays with the account on the backend (restored by the next login) and leaves
// this browser, so the next visitor on the device starts with an empty cart.
export function clear_cart_on_logout(): void {
  make_client_access().delete?.("cid");
  useCartStore.getState().clear();
}
