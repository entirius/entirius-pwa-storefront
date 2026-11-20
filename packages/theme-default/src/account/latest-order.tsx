// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { ChevronRight } from "lucide-react";
import { useAccountOverview } from "@entirius/storefront-sdk/account/page";
import { Link } from "@entirius/storefront-sdk/components/link";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Spinner } from "@theme/ui/spinner";
import { OrderStatus } from "@theme/account/order-status";

// The latest order, one link to its page.
export function LatestOrder() {
  const { t } = useI18n();
  const { latest_order: order } = useAccountOverview();
  return (
    <section aria-labelledby="latest-order" className="surface flex flex-col gap-4">
      <h2 id="latest-order" className="text-xl">
        {t("profile.latest_order")}
      </h2>
      {order === undefined ? (
        <Spinner className="size-5" />
      ) : !order ? (
        <p className="text-sm text-muted-foreground">{t("orders.none")}</p>
      ) : (
        <Link
          href={order.href}
          className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-border p-4 transition-colors hover:bg-muted"
        >
          <div className="min-w-48 flex-1">
            <p className="font-semibold text-heading">{t("profile.order_number", { id: order.id })}</p>
            <p className="text-sm text-muted-foreground">
              {order.date} · {t("orders.items", { count: order.items })}
            </p>
          </div>
          <OrderStatus status={order.status} />
          <span className="font-brand text-xl text-heading">{order.total}</span>
          <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
        </Link>
      )}
    </section>
  );
}
