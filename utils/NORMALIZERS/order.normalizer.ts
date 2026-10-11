// Normalizes the checkout/v2 `orders/list/` response into a stable Order shape.
// The list endpoint may return a bare array, a `{ data: [] }` envelope, or a
// DRF-style `{ results: [] }` page — unwrap all three defensively.

export type OrderAddress = {
  firstname: string;
  lastname: string;
  street: string;
  city: string;
  postcode: string;
  country_code: string;
  dialling_code: string;
  telephone: string;
  email: string;
  company: string | null;
  tax_id: string | null;
};

export type OrderSubItem = {
  sku: string | null;
  quantity: number;
  option_title: string | null;
};

export type OrderItem = {
  sku: string | null;
  name: string | null;
  quantity: number;
  price: string | null;
  total_price: string | null;
  image_url: string | null;
  sub_items: OrderSubItem[];
};

export type Order = {
  id: string;
  order_uuid: string;
  status: string;
  status_label: string;
  created: string;
  total: string;
  base_total: string;
  total_tax: string;
  currency_code: string;
  country_code: string;
  shipping_address: OrderAddress | null;
  billing_address: OrderAddress | null;
  item_count: number;
  items: OrderItem[];
};

const str = (v: unknown): string | null =>
  v === null || v === undefined || v === "" ? null : String(v);

function norm_address(a: any): OrderAddress | null {
  if (!a || typeof a !== "object") return null;
  return {
    firstname: str(a.firstname) ?? "",
    lastname: str(a.lastname) ?? "",
    street: str(a.street) ?? "",
    city: str(a.city) ?? "",
    postcode: str(a.postcode) ?? "",
    country_code: str(a.country_code) ?? "",
    dialling_code: str(a.dialling_code) ?? "",
    telephone: str(a.telephone) ?? "",
    email: str(a.email) ?? "",
    company: str(a.company),
    tax_id: str(a.tax_id),
  };
}

function norm_item(i: any): OrderItem {
  const subs = Array.isArray(i?.sub_items) ? i.sub_items : [];
  return {
    sku: str(i?.sku),
    name: str(i?.name),
    quantity: Number(i?.quantity ?? 1),
    price: str(i?.price),
    total_price: str(i?.total_price),
    image_url: str(i?.image_url),
    sub_items: subs.map((s: any) => ({
      sku: str(s?.sku),
      quantity: Number(s?.quantity ?? 1),
      option_title: str(s?.option_title),
    })),
  };
}

// The list row (orders/list/) is flat: order_id, total_gross, currency, item_count, no items. The detail
// (orders/<order_id>/) keeps the cart, the addresses and the totals under `order_body`.
function norm_order(o: any): Order {
  const body = o?.order_body ?? o;
  const items = Array.isArray(body?.cart?.items)
    ? body.cart.items
    : Array.isArray(o?.items)
      ? o.items
      : [];
  return {
    // v2 may expose `pretty_id`; v1 only had `id`. Prefer the human id.
    id: str(o?.pretty_id ?? o?.id ?? o?.order_id ?? o?.order_uuid) ?? "",
    order_uuid: str(o?.order_id ?? o?.order_uuid ?? o?.uuid ?? o?.id) ?? "",
    status: str(o?.status) ?? "",
    status_label: str(o?.status_label) ?? "",
    created: str(o?.created) ?? "",
    total: str(o?.total_gross ?? body?.total) ?? "0",
    base_total: str(body?.cart?.total_price ?? body?.base_total) ?? "0",
    total_tax: str(body?.total_tax) ?? "0",
    currency_code: str(o?.currency ?? body?.currency_code) ?? "",
    country_code: str(body?.country_code) ?? "",
    shipping_address: norm_address(body?.addresses?.shipping_address),
    billing_address: norm_address(body?.addresses?.billing_address),
    item_count: Number(o?.item_count ?? items.length),
    items: items.map(norm_item),
  };
}

const NORM_ORDER = norm_order;

function NORM_ORDERS(resp: any): Order[] {
  const list = Array.isArray(resp)
    ? resp
    : (resp?.data ?? resp?.results ?? []);
  if (!Array.isArray(list)) return [];
  return list.map(norm_order);
}

// status -> Tailwind pill classes.
export const status_colors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
  processing: { bg: "bg-blue-100", text: "text-blue-700" },
  confirmed: { bg: "bg-green-100", text: "text-green-700" },
  shipped: { bg: "bg-purple-100", text: "text-purple-700" },
  delivered: { bg: "bg-green-100", text: "text-green-700" },
  cancelled: { bg: "bg-red-100", text: "text-red-700" },
};

export function status_style(status: string): { bg: string; text: string } {
  return status_colors[status] ?? { bg: "bg-muted", text: "text-foreground" };
}

// Backend sends "2026-07-21 10:50" (space-separated, not ISO). Parse defensively
// and fall back to the raw string if the engine can't read it.
export function format_order_date(created: string, language: string): string {
  if (!created) return "";
  const d = new Date(created.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return created;
  return d.toLocaleDateString(language, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export { NORM_ORDER, NORM_ORDERS };
