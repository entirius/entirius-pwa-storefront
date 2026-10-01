// Normalizes checkout order responses into a stable Order shape.
// Two sources feed this:
//  - the v1 list (`{ data: [ ...whole orders ] }`) → NORM_ORDERS
//  - the v2 detail (`{ pretty_id, status, created, order_body: { ...the rest } }`)
//    → NORM_ORDER, which lifts `order_body` before normalizing.
// NORM_PLACED_ORDER covers the separate POST /orders/ (create) response.
// List responses may be a bare array, `{ data: [] }` or a DRF `{ results: [] }`
// page — unwrap all three defensively.

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
  base_price: string | null;
  special_percent: number | null;
  total_price: string | null;
  image_url: string | null;
  sub_items: OrderSubItem[];
};

export type OrderPaymentMethod = {
  code: string | null;
  name: string | null;
  pay_code: string | null;
};

export type OrderShippingMethod = {
  code: string | null;
  name: string | null;
  total_price: string | null;
  normal_price: string | null;
};

export type Order = {
  id: string;
  order_uuid: string;
  status: string;
  status_label: string;
  created: string;
  updated: string;
  comment: string | null;
  total: string;
  base_total: string;
  total_tax: string;
  total_netto: string;
  currency_code: string;
  country_code: string;
  shipping_address: OrderAddress | null;
  billing_address: OrderAddress | null;
  payment_methods: OrderPaymentMethod[];
  shipping_method: OrderShippingMethod | null;
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
  const special = Number(i?.special_percent);
  return {
    sku: str(i?.sku),
    name: str(i?.name),
    quantity: Number(i?.quantity ?? 1),
    // The backend calls the per-unit price `unit_price`; there is no `price` key.
    price: str(i?.unit_price ?? i?.price),
    base_price: str(i?.base_unit_price),
    special_percent: Number.isFinite(special) && special > 0 ? special : null,
    total_price: str(i?.total_price),
    image_url: str(i?.image_url),
    sub_items: subs.map((s: any) => ({
      sku: str(s?.sku),
      quantity: Number(s?.quantity ?? 1),
      option_title: str(s?.option_title),
    })),
  };
}

// `payment_method` is an array — an order can carry a voucher alongside the
// actual method (e.g. voucher + banktransfer).
function norm_payment_methods(p: any): OrderPaymentMethod[] {
  const list = Array.isArray(p) ? p : p ? [p] : [];
  return list.map((m: any) => ({
    code: str(m?.code),
    name: str(m?.name),
    pay_code: str(m?.pay_code),
  }));
}

function norm_shipping_method(s: any): OrderShippingMethod | null {
  if (!s || typeof s !== "object") return null;
  return {
    code: str(s.code),
    name: str(s.name),
    total_price: str(s.total_price),
    normal_price: str(s.normal_price),
  };
}

function norm_order(o: any): Order {
  const items = Array.isArray(o?.cart?.items)
    ? o.cart.items
    : Array.isArray(o?.items)
      ? o.items
      : [];
  return {
    // v2 may expose `pretty_id`; the legacy v1 client used `id`. Prefer the human id.
    id: str(o?.pretty_id ?? o?.id ?? o?.order_uuid) ?? "",
    // v1 calls the uuid `order_uuid`; the v2 detail/list call it `order_id`.
    order_uuid: str(o?.order_uuid ?? o?.order_id ?? o?.uuid ?? o?.id) ?? "",
    status: str(o?.status) ?? "",
    status_label: str(o?.status_label) ?? "",
    created: str(o?.created) ?? "",
    updated: str(o?.updated) ?? "",
    comment: str(o?.comment),
    total: str(o?.total) ?? "0",
    base_total: str(o?.base_total) ?? "0",
    total_tax: str(o?.total_tax) ?? "0",
    total_netto: str(o?.cart?.total_netto_price) ?? "0",
    currency_code: str(o?.currency_code) ?? "",
    country_code: str(o?.country_code) ?? "",
    shipping_address: norm_address(o?.addresses?.shipping_address),
    billing_address: norm_address(o?.addresses?.billing_address),
    payment_methods: norm_payment_methods(o?.payment_method),
    shipping_method: norm_shipping_method(o?.shipping_method),
    items: items.map(norm_item),
  };
}

function NORM_ORDERS(resp: any): Order[] {
  const list = Array.isArray(resp)
    ? resp
    : (resp?.data ?? resp?.results ?? []);
  if (!Array.isArray(list)) return [];
  return list.map(norm_order);
}

// Single order. The v2 detail response keeps only the header scalars at the top
// level (pretty_id/status/created/updated) and nests everything else in
// `order_body`, so flatten it — the outer spread keeps the top-level scalars
// winning. `{ data }` is unwrapped so a v1 detail response works too.
function NORM_ORDER(resp: any): Order {
  const raw = resp?.order_body ? resp : (resp?.data ?? resp);
  return norm_order({ ...(raw?.order_body ?? {}), ...raw });
}

// Status pills on the dark brand theme: status-coloured text on a 15 % tint of
// the same token (WCAG AA 5.4–7.2:1). Classes must stay literal for Tailwind.
const NOTICE = { bg: "bg-notice/15", text: "text-notice" };
const POSITIVE = { bg: "bg-positive/15", text: "text-positive" };
const NEGATIVE = { bg: "bg-destructive/15", text: "text-destructive" };
const INFORMATIVE = { bg: "bg-informative/15", text: "text-informative" };

export const status_colors: Record<string, { bg: string; text: string }> = {
  // Statuses this backend actually returns.
  unpaid: NOTICE,
  confirmed: POSITIVE,
  complete: POSITIVE,
  canceled: NEGATIVE,
  returned: NOTICE,
  // Carried over from the legacy client; not emitted by this backend.
  pending: NOTICE,
  processing: INFORMATIVE,
  shipped: INFORMATIVE,
  delivered: POSITIVE,
  cancelled: NEGATIVE,
};

export function status_style(status: string): { bg: string; text: string } {
  return status_colors[status] ?? { bg: "bg-muted", text: "text-foreground" };
}

// Backend sends "2026-07-21 10:50" (space-separated, not ISO). Parse defensively
// and fall back to the raw string if the engine can't read it.
export function format_order_date(created: string): string {
  if (!created) return "";
  const d = new Date(created.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return created;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Response of POST /checkout/v2/{channel}/orders/ (201). `payment_error` is set when
// the order was created but the payment provider failed to start. A split order
// (channel splitting by a product attribute) lists every part's number.
export type PlacedOrder = {
  order_id: string;
  pretty_id: string;
  status: string;
  redirect_url: string | null;
  split_pretty_ids: string[];
  payment_error: boolean;
};

function NORM_PLACED_ORDER(resp: unknown): PlacedOrder {
  const r = (resp ?? {}) as Record<string, unknown>;
  const split = r.split_orders_pretty_ids;
  return {
    order_id: str(r.order_id) ?? "",
    pretty_id: str(r.order_pretty_id) ?? "",
    status: str(r.order_status) ?? "",
    redirect_url: str(r.redirect_url),
    split_pretty_ids: Array.isArray(split) ? split.map(String) : [],
    payment_error: r.payment_error === true,
  };
}

export { NORM_ORDERS, NORM_ORDER, NORM_PLACED_ORDER };
