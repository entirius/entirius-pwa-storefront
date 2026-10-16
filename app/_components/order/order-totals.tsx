// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type * as React from "react";

import { FormHeading } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n.provider";
import type { Cart } from "@/utils/NORMALIZERS/cart.normalizer";

const num = (v: string | null | undefined) => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

// A backend amount worth a row: present and not zero.
const has_amount = (v: string | null | undefined) => num(v) !== 0;

// The card around the order summary, the same on the cart page and in checkout.
export function OrderSummaryCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <aside aria-label={t("checkout.summary")} className={cn("flex flex-col gap-4 rounded-lg border p-4", className)}>
      <FormHeading>{t("checkout.summary")}</FormHeading>
      {children}
    </aside>
  );
}

// Totals of the synced backend cart: subtotal, savings, discount codes, delivery, fee, total.
// `shipping_pending`: the cart page, where delivery is chosen later, says so instead of hiding the row.
export function OrderTotals({
  backend,
  currency,
  fetching,
  shipping_pending,
}: {
  backend: Cart | null | undefined;
  currency: string;
  fetching?: boolean;
  shipping_pending?: boolean;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const fmt = (v: string | null | undefined) => i18n.price(v, backend?.currency || currency);
  const applied_codes = (backend?.discounts ?? [])
    .filter((d) => d.status === "valid" && d.code)
    .map((d) => d.code);
  const discount_label =
    applied_codes.length > 0
      ? t("checkout.discount_codes", { codes: applied_codes.join(", ") })
      : t("checkout.discount");
  const has_shipping = !!backend?.shipping_method && backend.shipping_gross != null;

  return (
    <div className="flex flex-col gap-2 text-sm">
      <Row
        label={
          <span className="flex items-center gap-2">
            {t("cart.subtotal")}
            {fetching && <Spinner className="size-3" />}
          </span>
        }
        value={fmt(backend?.items_subtotal_gross)}
      />
      {has_amount(backend?.item_savings_gross) && (
        <Row label={t("checkout.sale_savings")} value={`−${fmt(backend?.item_savings_gross)}`} accent />
      )}
      {has_amount(backend?.total_discount_gross) && (
        <Row label={discount_label} value={`−${fmt(backend?.total_discount_gross)}`} accent />
      )}
      {has_shipping ? (
        <Row
          label={t("checkout.delivery")}
          value={num(backend?.shipping_gross) === 0 ? t("common.free") : fmt(backend?.shipping_gross)}
        />
      ) : (
        shipping_pending && <Row label={t("checkout.delivery")} value={t("cart.shipping_at_checkout")} muted />
      )}
      {num(backend?.fee_gross) > 0 && <Row label={t("checkout.payment_fee")} value={fmt(backend?.fee_gross)} />}
      {has_amount(backend?.amount_missing_for_free_shipping) && (
        <p className="text-xs text-muted-foreground">
          {t("checkout.free_shipping_away", { amount: fmt(backend?.amount_missing_for_free_shipping) })}
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
  );
}

function Row({
  label,
  value,
  accent,
  muted,
}: {
  label: React.ReactNode;
  value: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={accent ? "text-positive" : "text-muted-foreground"}>{label}</span>
      <span className={cn("text-right tabular-nums", accent && "text-positive", muted && "text-muted-foreground")}>{value}</span>
    </div>
  );
}
