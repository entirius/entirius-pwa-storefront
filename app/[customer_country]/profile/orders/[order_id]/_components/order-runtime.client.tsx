// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { OrderPageProvider, type OrderPageModel } from "@entirius/storefront-sdk/account/page";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { order_model } from "@/lib/account-models";
import { order_query } from "../api.query";

// One order's model for the theme's template (@theme/account/order-page).
export function OrderRuntime({ order_id, children }: { order_id: string; children: ReactNode }) {
  const i18n = useI18n();
  const { data: order, isLoading, isError } = useQuery(order_query(order_id));

  const model: OrderPageModel = {
    id: order_id,
    status: isLoading ? "loading" : isError || !order ? "error" : "ready",
    order: order ? order_model(order, i18n) : null,
  };

  return <OrderPageProvider value={model}>{children}</OrderPageProvider>;
}
