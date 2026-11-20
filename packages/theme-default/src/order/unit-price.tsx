// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { UnitPriceData } from "@entirius/storefront-sdk/cart";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { cn } from "@theme/lib/utils";

// Per-unit price. When a special price applies, strikes the regular price and accents the charged one with a
// "−N%" badge. The cart page and checkout show it the same way.
export function UnitPrice({ price, className }: { price: UnitPriceData; className?: string }) {
  const i18n = useI18n();
  const on_sale = price.regular !== null && price.regular !== price.final;

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {on_sale && <s className="text-muted-foreground/70">{i18n.price(price.regular, price.currency)}</s>}
      <span className={on_sale ? "font-medium text-destructive" : undefined}>
        {i18n.price(price.final, price.currency)}
      </span>
      {on_sale && price.percent_off ? (
        <span className="rounded bg-destructive-surface px-1 text-[10px] font-semibold text-destructive">
          −{price.percent_off}%
        </span>
      ) : null}
    </span>
  );
}
