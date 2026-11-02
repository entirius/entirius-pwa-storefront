// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Price } from "@/utils/NORMALIZERS/price.normalizer";

// Whether a product can go to the cart, by its `product_type`. The rules of a type run in order and the first
// one that fails is the reason, which picks the message: the type first, then the stock, then the price.
// A CONFIGURABLE parent has no stock or price of its own: its rules run on the chosen variant (a SIMPLE).
// A BUNDLE is asked by its own SKU; `stock/` answers what its components allow.
export type BuyRule = "variant" | "quantity" | "price" | "enquiry";

export type BuyTarget = {
  // CONFIGURABLE: a variant is chosen.
  variant?: boolean;
  // Real-time stock; undefined while it is not known (a tile before the click, a product page before the
  // stock answers). Unknown stock passes the rule: whoever adds to the cart asks for it first.
  quantity?: number;
  price: Price | null;
};

const RULES: Record<string, BuyRule[]> = {
  SIMPLE: ["quantity", "price"],
  BUNDLE: ["quantity", "price"],
  CONFIGURABLE: ["variant", "quantity", "price"],
  CUSTOM: ["enquiry"],
};

const PASSES: Record<BuyRule, (target: BuyTarget) => boolean> = {
  variant: (t) => !!t.variant,
  quantity: (t) => t.quantity === undefined || t.quantity > 0,
  // A fixed price; "from X" is the span of a parent's variants, not a price to pay.
  price: (t) => !!t.price && !t.price.from,
  enquiry: () => false,
};

// The rule that stops the product, or null when nothing known does. An unknown type is not sold online.
export function buy_block(product_type: string | undefined, target: BuyTarget): BuyRule | null {
  return (RULES[product_type ?? ""] ?? ["enquiry"]).find((rule) => !PASSES[rule](target)) ?? null;
}

// Whether the rules of a type read the stock (a CUSTOM product needs no stock request).
export const asks_stock = (product_type: string | undefined) =>
  !!RULES[product_type ?? ""]?.includes("quantity");

// Sold online at all: what stops it, if anything, is the stock or the variant choice, not the type or the price.
export const sold_online = (block: BuyRule | null) => block !== "enquiry" && block !== "price";
