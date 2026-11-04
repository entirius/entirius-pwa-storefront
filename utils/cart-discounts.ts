// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Cart } from "@/utils/NORMALIZERS/cart.normalizer";

// One entry of PATCH carts/{id}/discounts/: a code, and for a gratis rule the gift's SKU and quantity (the
// backend refuses a gift code without them).
export type DiscountInput = { code: string; sku?: string; quantity?: number };

// The manual codes on the cart as PATCH discounts/ takes them back. The endpoint replaces the whole set, so
// every change sends what should stay: the discount codes and the picked gift with its SKU and quantity.
export function kept_discounts(cart: Cart | null | undefined): DiscountInput[] {
  return (cart?.discounts ?? [])
    .filter((d) => !d.is_automatic && d.status === "valid" && d.code)
    .map((d) =>
      d.gratis_sku ? { code: d.code, sku: d.gratis_sku, quantity: d.gratis_quantity ?? 1 } : { code: d.code },
    );
}

// The kept codes with the gift of rule `code` set to `sku` × `quantity`, or dropped at quantity 0.
export function with_gift(kept: DiscountInput[], code: string, sku: string, quantity: number): DiscountInput[] {
  const others = kept.filter((d) => d.code !== code);
  return quantity > 0 ? [...others, { code, sku, quantity }] : others;
}

// The request body: an empty set clears the manual codes (automatic rules stay).
export const discounts_body = (codes: DiscountInput[]) => (codes.length ? { codes } : { clear: true });
