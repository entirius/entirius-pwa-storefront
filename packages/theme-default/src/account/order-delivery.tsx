// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { OrderModel } from "@entirius/storefront-sdk/account";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { OrderSection } from "@theme/account/order-section";

// Where the order goes and how: the shipping address, the delivery method (its pickup point) and its price.
export function OrderDelivery({ order }: { order: OrderModel }) {
  const { t } = useI18n();
  const { shipping_address: address, shipping } = order;
  if (!address) return null;
  return (
    <OrderSection icon="delivery" title={t("checkout.shipping_address")}>
      <div className="surface-outline bg-card">
        <p className="text-sm font-bold">{address.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{address.street}</p>
        <p className="text-sm text-muted-foreground">{address.city}</p>
        {address.phone && <p className="mt-1 text-xs text-muted-foreground">{t("orders.phone", { value: address.phone })}</p>}
        {address.email && <p className="text-xs text-muted-foreground">{address.email}</p>}
        {shipping && (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
            <span className="flex flex-col text-sm">
              {shipping.name}
              {shipping.point && <span className="text-xs text-muted-foreground">{shipping.point}</span>}
            </span>
            <span className="text-sm font-bold">
              {shipping.free ? (
                <>
                  {t("common.free")}{" "}
                  {shipping.regular && <span className="font-normal text-muted-foreground line-through">{shipping.regular}</span>}
                </>
              ) : (
                shipping.price
              )}
            </span>
          </div>
        )}
      </div>
    </OrderSection>
  );
}
