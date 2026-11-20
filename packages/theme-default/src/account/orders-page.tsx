// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useOrdersPage } from "@entirius/storefront-sdk/account/page";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";
import { Spinner } from "@theme/ui/spinner";
import { PageHeading } from "@theme/account/page-heading";
import { OrderCard } from "@theme/account/order-card";

// The customer's orders, newest first, a page at a time.
export function OrdersPage() {
  const { t } = useI18n();
  const { status, orders, more, probe } = useOrdersPage();
  return (
    <div className="flex flex-col gap-6 py-4">
      <PageHeading back={{ href: "/profile", label: t("profile.back") }} title={t("orders.title")} />
      {probe}
      {status === "loading" ? (
        <Spinner className="size-5" />
      ) : status === "error" ? (
        <p className="text-sm text-muted-foreground">{t("orders.load_failed")}</p>
      ) : !orders.length ? (
        <p className="text-sm text-muted-foreground">{t("orders.none")}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {orders.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
          {more.available && (
            <Button variant="outline" className="self-center" disabled={more.loading} onClick={more.load}>
              {more.loading ? <Spinner className="size-4" /> : t("orders.load_more")}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
