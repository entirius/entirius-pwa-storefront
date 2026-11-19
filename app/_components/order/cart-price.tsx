// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { UnitPriceData } from "@entirius/storefront-sdk/cart";
import { UnitPrice as ThemeUnitPrice } from "@theme/order/unit-price";
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

// Checkout's summary shows a backend line's unit price through the theme's part.
export function UnitPrice({ line, currency, className }: { line: CartLine | undefined; currency: string; className?: string }) {
  const price = unit_price(line, currency);
  return price && <ThemeUnitPrice price={price} className={className} />;
}
