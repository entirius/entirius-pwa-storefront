// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { UnitPriceData } from "@entirius/storefront-sdk/cart";
import type { CartLine } from "@/utils/NORMALIZERS/cart.normalizer";

// A backend cart line's per-unit price for the theme: the regular price only when a special price applies.
export function unit_price(line: CartLine | undefined, currency: string): UnitPriceData | null {
  if (!line?.final_unit_gross) return null;
  const on_sale = line.has_special_price && !!line.unit_gross && line.unit_gross !== line.final_unit_gross;
  return {
    regular: on_sale ? line.unit_gross : null,
    final: line.final_unit_gross,
    percent_off: line.percent_off,
    currency,
  };
}
