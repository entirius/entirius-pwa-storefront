import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { API_CART_ORDERS_LIST_ROUTE, API_CART_ORDER_ROUTE } from "@/API/api.routes";
import { NORM_ORDER, NORM_ORDERS, type Order } from "@/utils/NORMALIZERS/order.normalizer";

const api = () => create_api(make_client_access());

// Documented endpoint. It currently 500s server-side; the DEBUG-only probe console
// in the orders list lets you poke it (and the working v1 route) from the UI.
export const orders_query = () => ({
  queryKey: ["orders"] as const,
  queryFn: async (): Promise<Order[]> => {
    const [error, data] = await api().FETCH_METHOD(API_CART_ORDERS_LIST_ROUTE, {
      method: "GET",
      querys: { ordering: "-created", page: 1, page_size: 50 },
    });
    if (error) throw new Error("Failed to load orders");
    return NORM_ORDERS(data);
  },
});

// The list rows carry no items and no addresses: the details sheet loads the order itself.
export const order_query = (order_uuid: string) => ({
  queryKey: ["orders", order_uuid] as const,
  queryFn: async (): Promise<Order> => {
    const [error, data] = await api().FETCH_METHOD(
      API_CART_ORDER_ROUTE.replace("__ORDER_ID__", encodeURIComponent(order_uuid)),
      { method: "GET" },
    );
    if (error) throw new Error("Failed to load the order");
    return NORM_ORDER(data);
  },
});
