// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ReactNode } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { OrdersPageProvider, type OrdersPageModel } from "@entirius/storefront-sdk/account/page";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { DEBUG_MODE } from "@/_CONFIG/app.config.json";
import { API_CART_ORDERS_LIST_ROUTE } from "@/API/api.routes";
import { DevProbeButton } from "@/app/[customer_country]/checkout/_components/dev-probe-button";
import { order_summary_model } from "@/lib/account-models";
import { orders_query } from "../api.query";

// The orders list's model for the theme's template (@theme/account/orders-page): pages of orders, loaded on demand.
export function OrdersRuntime({ children }: { children: ReactNode }) {
  const i18n = useI18n();
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(orders_query());

  const model: OrdersPageModel = {
    status: isLoading ? "loading" : isError ? "error" : "ready",
    orders: (data?.pages ?? []).flatMap((page) => page.orders).map((order) => order_summary_model(order, i18n)),
    more: { available: hasNextPage, loading: isFetchingNextPage, load: () => fetchNextPage() },
    probe: DEBUG_MODE ? <DevProbeButton label="GET orders/list/ (v2)" route={API_CART_ORDERS_LIST_ROUTE} /> : null,
  };

  return <OrdersPageProvider value={model}>{children}</OrdersPageProvider>;
}
