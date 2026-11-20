// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { CheckoutSummaryLine } from "@entirius/storefront-sdk/checkout";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { ProductThumb } from "@theme/components/product-thumb";
import { UnitPrice } from "@theme/order/unit-price";

// A line of checkout's summary: picture, name, quantity and unit price, the line's total, what the backend refuses.
export function SummaryLine({ line }: { line: CheckoutSummaryLine }) {
  const { t } = useI18n();
  return (
    <div className="flex gap-3 py-3">
      <ProductThumb src={line.picture} alt={line.name} sizes="64px" className="w-16" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-medium">{line.name}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{t("checkout.quantity", { count: line.quantity })}</span>
          {line.unit && <UnitPrice price={line.unit} />}
        </div>
        {line.problem && (
          <p className="text-xs text-destructive">
            {line.problem === "out_of_stock" ? t("product.out_of_stock") : t("cart.limited")}
          </p>
        )}
      </div>
      <span className="text-sm font-medium tabular-nums">{line.total}</span>
    </div>
  );
}
