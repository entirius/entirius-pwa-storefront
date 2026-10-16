// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Amounts stay raw strings; the text is made at render time by price_lines() (lib/i18n/price-lines.ts),
// so the active language decides the separators, the currency symbol and the "From" / "Price on request" words.
type Price = {
  gross: string;
  currency: string;
  // Only present when a special price applies.
  final_gross?: string;
  // CONFIGURABLE: `gross` is the lowest price of its variants ("From X").
  from?: true;
};

// `null` — no list price (CUSTOM: priced per offer) or no amount: "Price on request".
// `is_range` — CONFIGURABLE: `gross` is null, the span of its variants sits in
// `range_from_*` / `range_to_*`; shown as the lowest price.
function NORM_PRICE_DATA(price: any): Price | null {
  if (!price) return null;
  const { currency } = price;
  if (price.is_range) {
    if (!price.range_from_gross) return null;
    return {
      gross: price.range_from_gross,
      currency,
      from: true,
      ...(price.range_from_special_gross ? { final_gross: price.range_from_special_gross } : {}),
    };
  }
  if (!price.gross) return null;
  return {
    gross: price.gross,
    currency,
    ...(price.has_special_price && price.final_gross ? { final_gross: price.final_gross } : {}),
  };
}

// A price read back from localStorage. Carts and wishlists saved before prices became raw amounts
// hold display strings (["549.00 EUR"]); those count as no price until the item is added again.
function stored_price(value: unknown): Price | null {
  const price = value as Price | null;
  return price && typeof price === "object" && !Array.isArray(price) && typeof price.gross === "string"
    ? price
    : null;
}

export { NORM_PRICE_DATA, stored_price };
export type { Price };
