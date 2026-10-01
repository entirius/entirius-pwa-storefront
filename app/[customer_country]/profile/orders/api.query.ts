// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { API_CART_ORDERS_V1_ROUTE } from "@/API/api.routes";
import { NORM_ORDERS, type Order } from "@/utils/NORMALIZERS/order.normalizer";

const api = () => create_api(make_client_access());

// v1, not the documented v2 `orders/list/`: v2 returns a slim summary row (no cart
// items, no addresses, `total_gross`/`currency` instead of `total`/`currency_code`)
// AND is not customer-scoped — it hands back every order in the channel. v1 returns
// this customer's whole orders. Both are wired to the DEBUG probe console in the
// orders list so the difference stays visible.
export const orders_query = () => ({
  queryKey: ["orders"] as const,
  queryFn: async (): Promise<Order[]> => {
    const [error, data] = await api().FETCH_METHOD(API_CART_ORDERS_V1_ROUTE, {
      method: "GET",
    });
    if (error) throw new Error("Failed to load orders");
    return NORM_ORDERS(data);
  },
});
