import { API_CART_ROUTE, API_CART_ITEMS_ROUTE } from "@/API/api.routes";
import { NORM_CART } from "@/utils/NORMALIZERS/cart.normalizer";
import type { CartItem } from "@/stores/cart.store";
import type { COOKIE_ACCESS } from "@/API/api";

type Api = { FETCH_METHOD: (path: string, options?: any) => Promise<any> };

const to_items = (items: Record<string, CartItem>) =>
  Object.values(items).map((i) => ({ sku: i.sku, quantity: i.quantity }));

// Client-driven sync: the backend cart is a projection of the local cart.
// - no cid            -> POST /carts/            (create), store cart_id in cid
// - cid + items       -> PATCH /carts/{cid}/items/ (full-replace)
// - cid + empty local -> DELETE /carts/{cid}/    (clear cid)
// v2 carts are otherwise immutable; /items/ is the only update path.
export const cart_query = (
  api: Api,
  access: COOKIE_ACCESS,
  items: Record<string, CartItem>,
  currency: string,
  // Auth identity (uid, or null when guest). Included in the key so a login /
  // logout re-syncs the cart: the re-sent POST/PATCH then carries the bearer
  // token, binding the cart to the customer on the backend.
  authId: string | null,
) => ({
  queryKey: ["cart", to_items(items), currency, authId] as const,
  staleTime: 0,
  queryFn: async () => {
    const cid = access.get("cid");
    const list = to_items(items);
    const body = JSON.stringify({ items: list, currency_code: currency });

    if (list.length === 0) {
      if (cid) {
        await api.FETCH_METHOD(API_CART_ROUTE, { method: "DELETE" });
        access.delete?.("cid");
      }
      return null;
    }

    if (cid) {
      const [error, response] = await api.FETCH_METHOD(API_CART_ITEMS_ROUTE, {
        method: "PATCH",
        body,
      });
      if (error) throw new Error(error.message);
      return NORM_CART(response);
    }

    const [error, response] = await api.FETCH_METHOD(API_CART_ROUTE, {
      method: "POST",
      body,
    });
    if (error) throw new Error(error.message);
    const id = response?.cart_id;
    if (id) access.set?.("cid", String(id));
    return NORM_CART(response);
  },
});
