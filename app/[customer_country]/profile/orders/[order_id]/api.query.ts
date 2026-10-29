// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { API_CART_ORDERS_ROUTE } from "@/API/api.routes";
import { NORM_ORDER, type Order } from "@/utils/NORMALIZERS/order.normalizer";

const api = () => create_api(make_client_access());

// GET .../orders/{pretty_id}/ — accepts the human id or the order uuid; the orders route's policy gives it
// x-api-key + Authorization. An unknown id answers 404 with an empty body, so it surfaces as a plain error.
export const order_query = (order_id: string) => ({
  queryKey: ["order", order_id] as const,
  queryFn: async (): Promise<Order> => {
    const [error, data] = await api().FETCH_METHOD(API_CART_ORDERS_ROUTE, { method: "GET", suffix: [order_id] });
    if (error) throw new Error("Failed to load order");
    return NORM_ORDER(data);
  },
});
