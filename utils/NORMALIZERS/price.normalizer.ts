// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

type Price = [string] | [string, string];
// [0] = base price display string
// [1] = special/final price (only present when has_special_price)

const PRICE_ON_REQUEST = "Price on request";

// `price: null` — the product has no list price (CUSTOM: priced per offer).
// `is_range` — CONFIGURABLE: `gross` is null, the span of its variants sits in
// `range_from_*` / `range_to_*`; shown as the lowest price ("From X").
function NORM_PRICE_DATA(price: any): Price {
  if (!price) return [PRICE_ON_REQUEST];
  if (price.is_range) {
    if (!price.range_from_gross) return [PRICE_ON_REQUEST];
    const base = `From ${price.range_from_gross} ${price.currency}`;
    if (price.range_from_special_gross) {
      return [base, `From ${price.range_from_special_gross} ${price.currency}`];
    }
    return [base];
  }
  if (!price.gross) return [PRICE_ON_REQUEST];
  const base = `${price.gross} ${price.currency}`;
  if (price.has_special_price && price.final_gross) {
    return [base, `${price.final_gross} ${price.currency}`];
  }
  return [base];
}

export { NORM_PRICE_DATA, PRICE_ON_REQUEST };
export type { Price };
