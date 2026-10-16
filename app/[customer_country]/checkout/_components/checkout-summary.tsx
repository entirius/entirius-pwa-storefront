// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { MediaImage } from "@/components/ui/media-image.client";
import { price_lines } from "@/lib/i18n/price-lines";
import { useI18n } from "@/providers/i18n.provider";
import { cn } from "@/lib/utils";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import { UnitPrice } from "@/app/_components/layout/cart-price";
import { DiscountCode } from "@/app/_components/layout/discount-code.client";
import type { Cart } from "@/utils/NORMALIZERS/cart.normalizer";
import type { CartItem } from "@/stores/cart.store";

const num = (v: string | null | undefined) => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

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
  const applied_codes = (backend?.discounts ?? [])
    .filter((d) => d.status === "valid" && d.code)
    .map((d) => d.code);
  const discount_label =
    applied_codes.length > 0
      ? t("checkout.discount_codes", { codes: applied_codes.join(", ") })
      : t("checkout.discount");

  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-3 text-sm text-muted-foreground">
        {t("checkout.summary")}
      </h2>
      <div className="flex flex-col divide-y">
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

      <div className="mt-4 border-t pt-4">
        <DiscountCode backend={backend} />
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t pt-4 text-sm">
        <Row label={t("cart.subtotal")} value={fmt(backend?.items_subtotal_gross)} />
        {backend?.item_savings_gross && (
          <Row
            label={t("checkout.sale_savings")}
            value={`−${fmt(backend.item_savings_gross)}`}
            accent
          />
        )}
        {backend?.total_discount_gross &&
          backend.total_discount_gross !== "0.00" && (
            <Row
              label={discount_label}
              value={`−${fmt(backend.total_discount_gross)}`}
              accent
            />
          )}
        {backend?.shipping_method && backend.shipping_gross != null && (
          <Row
            label={t("checkout.delivery")}
            value={num(backend.shipping_gross) === 0 ? t("common.free") : fmt(backend.shipping_gross)}
          />
        )}
        {num(backend?.fee_gross) > 0 && (
          <Row label={t("checkout.payment_fee")} value={fmt(backend?.fee_gross)} />
        )}
        {backend?.amount_missing_for_free_shipping &&
          backend.amount_missing_for_free_shipping !== "0.00" && (
            <p className="text-xs text-muted-foreground">
              {t("checkout.free_shipping_away", {
                amount: fmt(backend.amount_missing_for_free_shipping),
              })}
            </p>
          )}
        <div className="mt-1 flex items-center justify-between border-t pt-3 text-base font-semibold">
          <span>{t("cart.total")}</span>
          <span className="tabular-nums">{fmt(backend?.total_gross)}</span>
        </div>
        {backend?.total_tax && (
          <p className="text-right text-xs text-muted-foreground">
            {t("cart.incl_vat", { amount: fmt(backend.total_tax) })}
          </p>
        )}
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  const accent_cls = "text-positive";
  return (
    <div className="flex items-center justify-between">
      <span className={accent ? accent_cls : "text-muted-foreground"}>
        {label}
      </span>
      <span className={cn("tabular-nums", accent && accent_cls)}>{value}</span>
    </div>
  );
}
