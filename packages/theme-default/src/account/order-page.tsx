// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useOrderPage } from "@entirius/storefront-sdk/account/page";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Spinner } from "@theme/ui/spinner";
import { PageHeading } from "@theme/account/page-heading";
import { OrderStatus } from "@theme/account/order-status";
import { OrderLines } from "@theme/account/order-lines";
import { OrderDelivery } from "@theme/account/order-delivery";
import { OrderPayment } from "@theme/account/order-payment";
import { OrderSummary } from "@theme/account/order-summary";
import { OrderSection } from "@theme/account/order-section";

// One order: lines, delivery, payment, the billing address when it differs, the summary and the comment.
export function OrderPage() {
  const { t } = useI18n();
  const { id, status, order } = useOrderPage();
  return (
    <div className="flex flex-col gap-6 py-4">
      <PageHeading back={{ href: "/profile/orders", label: t("orders.back") }} title={t("orders.heading", { id: order?.id ?? id })}>
        {order && <OrderStatus status={order.status} className="ml-auto" />}
      </PageHeading>
      {status === "loading" ? (
        <Spinner className="size-5" />
      ) : !order ? (
        <p className="text-sm text-muted-foreground">{t("orders.load_one_failed")}</p>
      ) : (
        <>
          {order.date && <p className="-mt-4 text-xs text-muted-foreground">{t("orders.placed", { date: order.date })}</p>}
          <div className="flex flex-col gap-6">
            <OrderLines order={order} />
            <OrderDelivery order={order} />
            <OrderPayment order={order} />
            {order.billing_address && (
              <OrderSection icon="billing" title={t("checkout.billing_address")}>
                <div className="surface-outline bg-card">
                  <p className="text-sm font-bold">{order.billing_address.name}</p>
                  {order.billing_address.company && (
                    <p className="text-sm font-bold text-primary">{order.billing_address.company}</p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">{order.billing_address.street}</p>
                  <p className="text-sm text-muted-foreground">{order.billing_address.city}</p>
                  {order.billing_address.tax_id && (
                    <p className="mt-1 text-xs font-bold text-muted-foreground">
                      {t("address.tax_id_line", { value: order.billing_address.tax_id })}
                    </p>
                  )}
                </div>
              </OrderSection>
            )}
            <OrderSummary order={order} />
            {order.comment && (
              <OrderSection icon="summary" title={t("orders.comment")}>
                <div className="surface-outline bg-card">
                  <p className="text-sm text-muted-foreground">{order.comment}</p>
                </div>
              </OrderSection>
            )}
          </div>
        </>
      )}
    </div>
  );
}
