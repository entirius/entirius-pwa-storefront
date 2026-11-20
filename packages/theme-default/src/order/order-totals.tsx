// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ReactNode } from "react";
import type { OrderTotalsModel } from "@entirius/storefront-sdk/cart";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { cn } from "@theme/lib/utils";
import { Spinner } from "@theme/ui/spinner";

// The order's totals in the cart and checkout: subtotal, savings, gifts, discount codes, delivery, fee, the total
// and its VAT.
export function OrderTotals({ totals }: { totals: OrderTotalsModel }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-2 text-sm">
      <Row
        label={
          <span className="flex items-center gap-2">
            {t("cart.subtotal")}
            {totals.fetching && <Spinner className="size-3" />}
          </span>
        }
        value={totals.subtotal}
      />
      {totals.savings && <Row label={t("checkout.sale_savings")} value={`−${totals.savings}`} accent />}
      {totals.gifts && <Row label={t("cart.gifts")} value={totals.gifts.free ? t("common.free") : totals.gifts.price} />}
      {totals.discount && <Row label={totals.discount.label} value={`−${totals.discount.amount}`} accent />}
      {totals.delivery ? (
        <Row label={t("checkout.delivery")} value={totals.delivery.free ? t("common.free") : totals.delivery.price} />
      ) : (
        totals.delivery_at_checkout && <Row label={t("checkout.delivery")} value={t("cart.shipping_at_checkout")} muted />
      )}
      {totals.fee && <Row label={t("checkout.payment_fee")} value={totals.fee} />}
      {totals.free_shipping_away && (
        <p className="text-xs text-muted-foreground">{t("checkout.free_shipping_away", { amount: totals.free_shipping_away })}</p>
      )}
      <div className="mt-1 flex items-center justify-between border-t pt-3 text-base font-semibold">
        <span>{t("cart.total")}</span>
        <span className="tabular-nums">{totals.total}</span>
      </div>
      {totals.vat && <p className="text-right text-xs text-muted-foreground">{t("cart.incl_vat", { amount: totals.vat })}</p>}
    </div>
  );
}

function Row({ label, value, accent, muted }: { label: ReactNode; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={accent ? "text-positive" : "text-muted-foreground"}>{label}</span>
      <span className={cn("text-right tabular-nums", accent && "text-positive", muted && "text-muted-foreground")}>{value}</span>
    </div>
  );
}
