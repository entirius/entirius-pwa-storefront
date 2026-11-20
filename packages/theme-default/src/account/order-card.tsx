// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Calendar, Eye, Package, Receipt } from "lucide-react";
import type { OrderSummaryModel } from "@entirius/storefront-sdk/account";
import { Link } from "@entirius/storefront-sdk/components/link";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { OrderStatus } from "@theme/account/order-status";

// An order on the list: number, status, date, pieces, total; the whole card links to the order.
export function OrderCard({ order }: { order: OrderSummaryModel }) {
  const { t } = useI18n();
  return (
    <Link
      href={order.href}
      className="block w-full overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-primary"
    >
      <div className="px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <Receipt className="size-3.5 text-foreground" />
            </div>
            <span className="text-sm font-semibold">#{order.id}</span>
          </div>
          <OrderStatus status={order.status} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{order.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t("orders.items", { count: order.items })}</span>
            </div>
          </div>
          <span className="text-base font-bold">{order.total}</span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-muted py-2">
          <Eye className="size-3.5 text-foreground" />
          <span className="text-sm font-bold">{t("orders.view")}</span>
        </div>
      </div>
    </Link>
  );
}
