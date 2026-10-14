// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { useMemo, useSyncExternalStore } from "react";
import type { PlacedOrder } from "@/utils/NORMALIZERS/order.normalizer";

// What the customer needs after the order is placed. The guest cannot read the order back (the
// order endpoints need a logged-in customer), so the review step stores this snapshot of the cart
// and the success page shows it. sessionStorage: it lives as long as the tab does.
const STORAGE_KEY = "order-receipt";

export type OrderReceipt = {
  refs: string[];
  placed_at: string; // ISO time the order was placed
  total: string | null;
  currency: string;
  payment: { name: string; description: string | null; is_transfer: boolean } | null;
  shipping: { name: string; price: string | null } | null;
};

// Order numbers of a placed order: every part of a split order, else the order itself.
export function order_refs(order: PlacedOrder): string[] {
  return order.split_pretty_ids.length ? order.split_pretty_ids : [order.pretty_id].filter(Boolean);
}

export function save_receipt(receipt: OrderReceipt) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(receipt));
}

const subscribe = () => () => {};

// The stored receipt, only when it belongs to the order the page is about. Null on the server and
// during hydration (sessionStorage is client only).
export function useOrderReceipt(refs: string[]): OrderReceipt | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(STORAGE_KEY),
    () => null,
  );
  const key = refs.join(",");
  return useMemo(() => {
    try {
      const receipt: OrderReceipt | null = raw ? JSON.parse(raw) : null;
      return receipt && key && receipt.refs.join(",") === key ? receipt : null;
    } catch {
      return null;
    }
  }, [raw, key]);
}

// The payment description (plain text or HTML) plus amount and order number, as one block to paste
// into a banking app.
export function transfer_details(receipt: OrderReceipt, amount: string, labels: { amount: string; number: string }) {
  const description = (receipt.payment?.description ?? "")
    .replace(/<br\s*\/?>|<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return [description, `${labels.amount}: ${amount}`, `${labels.number}: ${receipt.refs.join(", ")}`]
    .filter(Boolean)
    .join("\n");
}
