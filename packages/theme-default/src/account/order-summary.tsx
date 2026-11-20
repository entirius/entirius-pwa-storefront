// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { OrderModel } from "@entirius/storefront-sdk/account";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { cn } from "@theme/lib/utils";
import { OrderSection } from "@theme/account/order-section";

// The order's money: the items net, VAT, delivery, the total and what the discounts saved.
export function OrderSummary({ order }: { order: OrderModel }) {
  const { t } = useI18n();
  const { summary } = order;
  return (
    <OrderSection icon="summary" title={t("orders.summary")}>
      <div className="surface-outline bg-card">
        <Row label={t("orders.items_net")} value={summary.net} />
        <Row label={t("orders.tax")} value={summary.tax} className="mt-2" />
        {summary.shipping !== null && (
          <Row label={t("orders.shipping")} value={summary.free_shipping ? t("common.free") : summary.shipping} className="mt-2" />
        )}
        <div className="my-3 border-t border-border" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{t("orders.total")}</span>
          <span className="text-lg font-bold text-primary">{summary.total}</span>
        </div>
        {summary.saved && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("orders.you_saved")}</span>
            <span className="text-sm font-bold text-primary">{summary.saved}</span>
          </div>
        )}
      </div>
    </OrderSection>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
