// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { OrderModel } from "@entirius/storefront-sdk/account";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { cn } from "@theme/lib/utils";
import { OrderSection } from "@theme/account/order-section";

// The ordered products: quantity × unit price (the regular one struck, the discount), the line's total, and a
// bundle's parts under it.
export function OrderLines({ order }: { order: OrderModel }) {
  const { t } = useI18n();
  const { lines } = order;
  if (!lines.length) return null;
  return (
    <OrderSection icon="lines" title={t("orders.items_heading", { count: lines.length })}>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {lines.map((line, i) => (
          <div key={i} className={cn("px-5 py-3", i !== lines.length - 1 && "border-b border-border")}>
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-3">
                <p className="line-clamp-2 text-sm font-bold">{line.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t("orders.quantity", { count: line.quantity })}
                  {line.unit && (
                    <>
                      {" × "}
                      {line.unit.regular && <span className="line-through">{line.unit.regular}</span>} {line.unit.price}
                      {line.unit.percent && <span className="ml-1 font-bold text-primary">−{line.unit.percent}%</span>}
                    </>
                  )}
                </p>
              </div>
              <span className="text-sm font-bold">{line.total}</span>
            </div>
            {line.sub_items.length > 0 && (
              <div className="mt-2 flex flex-col gap-1 border-l border-border pl-3">
                {line.sub_items.map((sub, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <span className="flex-1 truncate pr-3 text-xs text-muted-foreground">{sub.label}</span>
                    <span className="text-xs text-muted-foreground">×{sub.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </OrderSection>
  );
}
