// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { MediaImage } from "@/components/ui/media-image.client";
import { price_lines } from "@/lib/i18n/price-lines";
import { useI18n } from "@/providers/i18n.provider";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import { UnitPrice } from "@/app/_components/layout/cart-price";
import { DiscountCode } from "@/app/_components/layout/discount-code.client";
import type { Cart } from "@/utils/NORMALIZERS/cart.normalizer";
import type { CartItem } from "@/stores/cart.store";
import { OrderSummaryCard, OrderTotals } from "./order-totals";

// Read-only order summary (authoritative totals from the synced backend cart, local
// line-price fallback). Rendered in the sticky right column of the checkout stepper.
export function CheckoutSummary({
  backend,
  items,
  currency,
}: {
  backend: Cart | null | undefined;
  items: Record<string, CartItem>;
  currency: string;
}) {
  const entries = Object.entries(items);
  const currency_label = backend?.currency || currency;
  const i18n = useI18n();
  const { t } = i18n;
  const fmt = (v: string | null | undefined) => i18n.price(v, currency_label);
  return (
    <OrderSummaryCard>
      <div className="-mt-1 flex flex-col divide-y">
        {entries.map(([sku, item]) => {
          const uri = item.media?.[0]?.[0]?.uri ?? image_placeholder;
          const line = backend?.lines[sku];
          const flagged = line?.is_limited || backend?.error_skus.has(sku);
          const line_total = line
            ? fmt(line.final_total_gross)
            : price_lines(i18n, item.price).at(-1);
          return (
            <div key={sku} className="flex gap-3 py-3">
              <div className="relative w-16 aspect-product self-start shrink-0 overflow-hidden rounded-md bg-muted">
                <MediaImage
                  src={uri}
                  alt={item.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{t("checkout.quantity", { count: item.quantity })}</span>
                  {line ? (
                    <UnitPrice line={line} currency={currency_label} />
                  ) : null}
                </div>
                {flagged && (
                  <p className="text-xs text-destructive">
                    {line?.status === "out_of_stock"
                      ? t("product.out_of_stock")
                      : t("cart.limited")}
                  </p>
                )}
              </div>
              <span className="text-sm font-medium tabular-nums">
                {line_total}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t pt-4">
        <DiscountCode backend={backend} />
      </div>

      <div className="border-t pt-4">
        <OrderTotals backend={backend} currency={currency} />
      </div>
    </OrderSummaryCard>
  );
}
