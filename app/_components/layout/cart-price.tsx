// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n.provider";
import type { CartLine } from "@/utils/NORMALIZERS/cart.normalizer";

// Per-unit price. When a special/sale price applies, strikes the list price and
// accents the charged price + a "−N%" badge. Shared by the cart page and checkout so
// the "changed price" reads the same in both.
export function UnitPrice({
  line,
  currency,
  className,
}: {
  line: CartLine | undefined;
  currency: string;
  className?: string;
}) {
  const i18n = useI18n();
  if (!line?.final_unit_gross) return null;
  const on_sale =
    line.has_special_price &&
    !!line.unit_gross &&
    line.unit_gross !== line.final_unit_gross;

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {on_sale && (
        <s className="text-muted-foreground/70">
          {i18n.price(line.unit_gross, currency)}
        </s>
      )}
      <span className={on_sale ? "font-medium text-destructive" : undefined}>
        {i18n.price(line.final_unit_gross, currency)}
      </span>
      {on_sale && line.percent_off ? (
        <span className="rounded bg-destructive-surface px-1 text-[10px] font-semibold text-destructive">
          −{line.percent_off}%
        </span>
      ) : null}
    </span>
  );
}
