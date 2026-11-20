// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { OrderModel } from "@entirius/storefront-sdk/account";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { cn } from "@theme/lib/utils";
import { OrderSection } from "@theme/account/order-section";

// How the order was paid: the methods and their payment codes.
export function OrderPayment({ order }: { order: OrderModel }) {
  const { t } = useI18n();
  const { payments } = order;
  if (!payments.length) return null;
  return (
    <OrderSection icon="payment" title={t("orders.payment")}>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {payments.map((payment, i) => (
          <div
            key={i}
            className={cn("flex items-center justify-between px-5 py-3", i !== payments.length - 1 && "border-b border-border")}
          >
            <span className="text-sm font-bold">{payment.name}</span>
            {payment.pay_code && <span className="font-mono text-xs text-muted-foreground">{payment.pay_code}</span>}
          </div>
        ))}
      </div>
    </OrderSection>
  );
}
