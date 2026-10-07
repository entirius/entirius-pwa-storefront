// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { infiniteQueryOptions } from "@tanstack/react-query";

import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { API_CART_ORDERS_LIST_ROUTE } from "@/API/api.routes";
import {
  NORM_ORDER_SUMMARIES,
  type OrderSummaryPage,
} from "@/utils/NORMALIZERS/order.normalizer";

const api = () => create_api(make_client_access());

// v2 `orders/list/`: this customer's orders, newest first, 20 per page
// (`page` / `page_size`; `next` is null on the last page). Summary rows only —
// items and addresses come from the detail.
export const orders_query = () =>
  infiniteQueryOptions({
    queryKey: ["orders"] as const,
    initialPageParam: 1,
    queryFn: async ({ pageParam }): Promise<OrderSummaryPage> => {
      const [error, data] = await api().FETCH_METHOD(API_CART_ORDERS_LIST_ROUTE, {
        method: "GET",
        querys: { page: String(pageParam) },
      });
      if (error) throw new Error("Failed to load orders");
      return NORM_ORDER_SUMMARIES(data);
    },
    getNextPageParam: (last, _all, page) => (last.has_next ? page + 1 : undefined),
  });
