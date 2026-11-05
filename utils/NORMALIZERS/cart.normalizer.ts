// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Normalizes the checkout/v2 cart response (a flat object — no {meta,data}
// envelope) into the shape the cart drawer + checkout render. Prices are strings
// ("0.00"); the currency is separate.
//
// Two independent price reductions the UI must surface:
//   1. Special/sale price (per line): unit_gross -> final_unit_gross, with percent_off.
//   2. Auto-applied cart discount (discounts[] code): per-line discount_gross, summed
//      into total_discount_gross. Kicks in at qty>=2 on this channel.
// Line final_total_gross is AFTER the special price but BEFORE the code discount;
// cart total_gross is after both. `item_savings_gross` = Σ list price - Σfinal_total_gross
// captures the special-price saving so the two can be shown as distinct rows.
//
// Gift lines (`is_gratis`, picked through a gratis rule's code) are kept apart in `gifts`: their list price is
// not part of the subtotal or the savings, and their SKU may also be a line the customer pays for.

import { resolve_media_url } from "@/utils/media-url";

type CartLine = {
  sku: string;
  quantity: number;
  status: string; // "valid" | "out_of_stock" | ...
  unit_gross: string | null; // list price / unit (pre-special)
  final_unit_gross: string | null; // price actually charged / unit (post-special)
  final_total_gross: string | null; // final_unit_gross * qty (pre-code-discount)
  unit_tax: string | null;
  has_special_price: boolean;
  percent_off: number | null; // e.g. 17
  discount_gross: string | null; // code discount allocated to this line
  is_limited: boolean;
  is_gratis: boolean; // a gift picked through a gratis rule, charged at the gift price
};

type CartDiscount = {
  code: string;
  modifier: string;
  status: string;
  is_automatic: boolean;
  free_shipping: boolean;
  gratis_sku: string | null; // the gift picked for a gratis rule
  gratis_quantity: number | null;
};

type CartError = {
  code: string;
  message: string;
  scope: string | null; // "discounts" for a refused code, else about the items
  sku: string | null;
  discount_code: string | null; // the refused code, for a discount error
};

// What the cart says about its gratis rules: whether one applies, how much is missing to the next tier, and the
// rules themselves (filled since django-checkout 10.1.0).
type CartGratis = {
  is_available: boolean;
  nearest_tier_price: string | null;
  amount_missing: string | null;
  rules: GratisRule[];
};

// One gratis rule of the cart's `gratis.rules`: the gifts to pick from (each at its gift price) and how many
// pieces the cart allows now. `code` is what PATCH discounts/ takes, with the gift's SKU and quantity.
type GratisRule = {
  code: string;
  name: string;
  items: { sku: string; price: string }[];
  max_quantity: number;
  next_tier_quantity: number | null;
};

// A billing/shipping address as the cart stores it (nested under `addresses`).
// Fields mirror the PATCH /addresses/ body; email/company/tax_id only on billing.
type CartAddress = {
  email: string | null;
  firstname: string | null;
  lastname: string | null;
  street: string | null;
  city: string | null;
  postcode: string | null;
  country_code: string | null;
  dialling_code: string | null;
  telephone: string | null;
  company: string | null;
  tax_id: string | null;
  requested_invoice: boolean;
};

// A shipping method as returned by GET /shipping-methods/ (list) and echoed back
// as the cart's selected `shipping_method`.
type ShippingMethod = {
  code: string;
  name: string;
  price: string | null;
  description: string | null;
  free_delivery_above: string | null;
};

type PaymentMethod = {
  code: string;
  name: string;
  description: string | null;
  image: string | null; // logo URL, when the method carries one
  provider: string | null; // gateway provider, e.g. "payu_card"
  fee: string | null; // extra fee (e.g. cash-on-delivery), when > 0
  is_transfer: boolean; // offline bank transfer (provider "transfer"): the customer pays after the order
};

type Cart = {
  cart_id: string;
  cart_status: string;
  validation_status: string;
  currency: string;
  allowed_guest_checkout: boolean;
  subtotal_gross: string | null; // backend subtotal; may already include delivery once one is chosen
  items_subtotal_gross: string | null; // Σ list price of the items only (pre any reduction)
  shipping_gross: string | null; // price of the chosen delivery method, when one is chosen
  fee_gross: string | null; // payment surcharge, when the backend reports one
  total_gross: string | null; // payable (post special + code discount)
  total_tax: string | null;
  total_discount_gross: string | null; // Σ code discounts
  item_savings_gross: string | null; // Σ special-price savings (derived), null when 0
  gifts: CartLine[];
  gifts_total_gross: string | null; // Σ gift lines at the gift price, null without gifts
  gratis: CartGratis;
  discounts: CartDiscount[];
  free_shipping: boolean;
  amount_missing_for_free_shipping: string | null;
  tax_rates: Record<string, string>;
  lines: Record<string, CartLine>;
  errors: CartError[];
  error_skus: Set<string>;
  // Checkout "needed" fields the backend fills in as the flow progresses; used to
  // hydrate the address form + preselect the shipping method on reload / revisit.
  billing_address: CartAddress | null;
  shipping_address: CartAddress | null;
  shipping_method: ShippingMethod | null;
  payment_method: PaymentMethod | null;
  need_full_address: boolean;
};

// The checkout/v2 cart as the backend sends it: the fields read here.
type RawCartItem = {
  sku?: string;
  quantity?: number | string;
  status?: string;
  unit_gross?: string | null;
  total_gross?: string | null;
  final_unit_gross?: string | null;
  final_total_gross?: string | null;
  unit_tax?: string | null;
  has_special_price?: boolean;
  percent_off?: number | string | null;
  discount_gross?: string | null;
  is_gratis?: boolean;
};

type RawCartDiscount = {
  code?: string;
  modifier?: string;
  status?: string;
  is_automatic?: boolean;
  free_shipping?: boolean;
  gratis_sku?: string | null;
  gratis_quantity?: number | null;
};

type RawCartError = {
  code?: string;
  message?: string;
  scope?: string | null;
  meta?: { sku?: string | null; code?: string | null } | null;
};

type RawCartGratis = {
  is_available?: boolean;
  nearest_tier_price?: string | null;
  amount_missing?: string | null;
  rules?: unknown;
};

// A rule of the cart's `gratis.rules`, as `GET carts/{id}/gratis-rules/` lists it too (the cart sends the amounts
// as strings, that route as JSON numbers).
type RawGratisRule = {
  code?: string;
  name?: string | null;
  items?: { sku?: string; price?: number | string | null }[] | null;
  max_available_quantity?: number | null;
  next_gratis_tier_quantity?: number | null;
};

type RawCartAddress = {
  email?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  street?: string | null;
  city?: string | null;
  postcode?: string | null;
  country_code?: string | null;
  dialling_code?: string | null;
  telephone?: string | null;
  company?: string | null;
  tax_id?: string | null;
  requested_invoice?: boolean;
};

type RawCartAddresses = {
  billing_address?: RawCartAddress | null;
  shipping_address?: RawCartAddress | null;
};

type RawShippingMethod = {
  code?: string;
  name?: string | null;
  price?: string | null;
  total_price?: string | null;
  final_gross?: string | null;
  description?: string | null;
  free_delivery_above?: string | null;
};

type RawPaymentMethod = {
  code?: string;
  name?: string | null;
  description?: string | null;
  image?: string | null;
  provider?: string | null;
  cash_on_delivery_fee?: string | null;
  fee?: string | null;
  fee_gross?: string | null;
};

type RawCart = {
  cart_id?: string;
  cart_status?: string;
  validation_status?: string;
  currency?: string;
  allowed_guest_checkout?: boolean;
  subtotal_gross?: string | null;
  fee_gross?: string | null;
  total_gross?: string | null;
  total_tax?: string | null;
  total_discount_gross?: string | null;
  free_shipping?: boolean;
  amount_missing_for_free_shipping?: string | null;
  tax_rates?: Record<string, string> | null;
  items?: RawCartItem[];
  discounts?: RawCartDiscount[];
  _errors?: RawCartError[];
  addresses?: RawCartAddresses | null;
  billing_address?: RawCartAddress | null;
  shipping_address?: RawCartAddress | null;
  shipping_method?: RawShippingMethod | null;
  payment_method?: RawPaymentMethod | null;
  need_full_address?: boolean;
  gratis?: RawCartGratis | null;
};

// The method lists, either bare or wrapped in { data }.
type RawMethodList<T> = T[] | { data?: T[] } | null | undefined;

const num = (v: unknown) => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

const str = (v: unknown): string | null =>
  v == null || v === "" ? null : String(v);

// An amount the API sends as a JSON number or a string → the "0.00" string the rest of the cart uses.
const amount = (v: unknown): string | null => {
  const n = parseFloat(String(v));
  return v == null || v === "" || !Number.isFinite(n) ? null : n.toFixed(2);
};

// A cart address object → typed CartAddress, or null when absent/empty.
function norm_address(a: RawCartAddress | null | undefined): CartAddress | null {
  if (!a || typeof a !== "object" || !Object.keys(a).length) return null;
  return {
    email: str(a.email),
    firstname: str(a.firstname),
    lastname: str(a.lastname),
    street: str(a.street),
    city: str(a.city),
    postcode: str(a.postcode),
    country_code: str(a.country_code),
    dialling_code: str(a.dialling_code),
    telephone: str(a.telephone),
    company: str(a.company),
    tax_id: str(a.tax_id),
    requested_invoice: Boolean(a.requested_invoice),
  };
}

// One shipping method entry (from the list GET or the cart's selected method).
function norm_method(m: RawShippingMethod | null | undefined): ShippingMethod | null {
  if (!m || typeof m !== "object" || !m.code) return null;
  return {
    code: String(m.code),
    name: str(m.name) ?? String(m.code),
    // The list uses `price` or `total_price` depending on the backend build; the cart's own
    // method carries `final_gross` (after free delivery).
    price: str(m.price ?? m.total_price ?? m.final_gross),
    description: str(m.description),
    free_delivery_above: str(m.free_delivery_above),
  };
}

// GET /shipping-methods/ response → ShippingMethod[]. The envelope is inconsistent
// across this API (carts are flat, but this GET may come back wrapped in { data }),
// so accept both a bare array and a { data } wrapper. Entries without a code drop.
function NORM_SHIPPING_METHODS(resp: unknown): ShippingMethod[] {
  const body = resp as RawMethodList<RawShippingMethod>;
  const list = Array.isArray(body) ? body : (body?.data ?? []);
  if (!Array.isArray(list)) return [];
  return list
    .map(norm_method)
    .filter((m): m is ShippingMethod => m !== null);
}

// One payment method entry (from the list GET or the cart's selected method).
function norm_payment(m: RawPaymentMethod | null | undefined): PaymentMethod | null {
  if (!m || typeof m !== "object" || !m.code) return null;
  return {
    code: String(m.code),
    name: str(m.name) ?? String(m.code),
    description: str(m.description),
    image: resolve_media_url(str(m.image)) || null,
    provider: str(m.provider),
    fee: str(m.cash_on_delivery_fee ?? m.fee ?? m.fee_gross),
    is_transfer: m.provider === "transfer",
  };
}

// GET /payment-methods/ response → PaymentMethod[]. Same dual-envelope unwrap.
function NORM_PAYMENT_METHODS(resp: unknown): PaymentMethod[] {
  const body = resp as RawMethodList<RawPaymentMethod>;
  const list = Array.isArray(body) ? body : (body?.data ?? []);
  if (!Array.isArray(list)) return [];
  return list
    .map(norm_payment)
    .filter((m): m is PaymentMethod => m !== null);
}

// The cart's `gratis.rules` → the rules that offer a gift now. Gifts without a SKU drop.
function NORM_GRATIS_RULES(resp: unknown): GratisRule[] {
  const list = Array.isArray(resp) ? (resp as RawGratisRule[]) : [];
  return list
    .filter((r) => r?.code)
    .map((r) => ({
      code: String(r.code),
      name: str(r.name) ?? String(r.code),
      items: (Array.isArray(r.items) ? r.items : [])
        .filter((i) => i?.sku)
        .map((i) => ({ sku: String(i.sku), price: amount(i.price) ?? "0.00" })),
      max_quantity: Math.max(0, Number(r.max_available_quantity ?? 0) || 0),
      next_tier_quantity: r.next_gratis_tier_quantity ? Number(r.next_gratis_tier_quantity) : null,
    }));
}

function NORM_CART(resp: unknown): Cart {
  const data = resp as RawCart | null | undefined;
  const raw_items: RawCartItem[] = Array.isArray(data?.items) ? data.items : [];
  const lines: Record<string, CartLine> = {};
  const gifts: CartLine[] = [];
  let sum_final = 0;
  let sum_list = 0;
  let sum_gifts = 0;
  for (const it of raw_items) {
    if (!it?.sku) continue;
    const is_gratis = Boolean(it.is_gratis);
    if (is_gratis) sum_gifts += num(it.final_total_gross);
    else {
      sum_final += num(it.final_total_gross);
      sum_list += num(it.total_gross ?? num(it.unit_gross) * num(it.quantity));
    }
    const line: CartLine = {
      sku: it.sku,
      quantity: Number(it.quantity ?? 0),
      status: it.status ?? "unknown",
      unit_gross: it.unit_gross ?? null,
      final_unit_gross: it.final_unit_gross ?? null,
      final_total_gross: it.final_total_gross ?? null,
      unit_tax: it.unit_tax ?? null,
      has_special_price: Boolean(it.has_special_price),
      percent_off:
        it.percent_off == null || it.percent_off === ""
          ? null
          : Number(it.percent_off),
      discount_gross: it.discount_gross ?? null,
      // "valid" is the saleable status on v2; anything else limits the line.
      is_limited: it.status !== "valid" && it.status !== "in_stock",
      is_gratis,
    };
    if (is_gratis) gifts.push(line);
    else lines[it.sku] = line;
  }

  // Special-price saving = list price of the items − Σ line finals (before code discounts).
  const item_savings = sum_list - sum_final;

  const raw_discounts: RawCartDiscount[] = Array.isArray(data?.discounts)
    ? data.discounts
    : [];
  const discounts: CartDiscount[] = raw_discounts.map((d) => ({
    code: d?.code ?? "",
    modifier: d?.modifier ?? "",
    status: d?.status ?? "",
    is_automatic: Boolean(d?.is_automatic),
    free_shipping: Boolean(d?.free_shipping),
    gratis_sku: str(d?.gratis_sku),
    gratis_quantity: d?.gratis_quantity == null ? null : Number(d.gratis_quantity),
  }));

  const raw_errors: RawCartError[] = Array.isArray(data?._errors) ? data._errors : [];
  const errors: CartError[] = raw_errors.map((e) => ({
    code: e?.code ?? "UNKNOWN",
    message: e?.message ?? "",
    scope: e?.scope ?? null,
    sku: e?.meta?.sku ?? null,
    discount_code: e?.scope === "discounts" ? (e?.meta?.code ?? null) : null,
  }));
  const error_skus = new Set(
    errors.map((e) => e.sku).filter((s): s is string => Boolean(s)),
  );

  // Addresses nest under `addresses`; fall back to top-level in case the backend
  // returns them flat on some responses.
  const addresses: RawCartAddresses = data?.addresses ?? {};
  const billing_address = norm_address(
    addresses.billing_address ?? data?.billing_address,
  );
  const shipping_address = norm_address(
    addresses.shipping_address ?? data?.shipping_address,
  );

  return {
    cart_id: data?.cart_id ?? "",
    cart_status: data?.cart_status ?? "",
    validation_status: data?.validation_status ?? "",
    currency: data?.currency ?? "",
    allowed_guest_checkout: Boolean(data?.allowed_guest_checkout),
    subtotal_gross: data?.subtotal_gross ?? null,
    items_subtotal_gross: raw_items.length > gifts.length ? sum_list.toFixed(2) : (data?.subtotal_gross ?? null),
    shipping_gross: str(data?.shipping_method?.final_gross),
    fee_gross: str(data?.fee_gross ?? data?.payment_method?.fee_gross),
    total_gross: data?.total_gross ?? null,
    total_tax: data?.total_tax ?? null,
    total_discount_gross: data?.total_discount_gross ?? null,
    item_savings_gross: item_savings > 0.005 ? item_savings.toFixed(2) : null,
    gifts,
    gifts_total_gross: gifts.length ? sum_gifts.toFixed(2) : null,
    gratis: {
      is_available: Boolean(data?.gratis?.is_available),
      nearest_tier_price: str(data?.gratis?.nearest_tier_price),
      amount_missing: str(data?.gratis?.amount_missing),
      rules: NORM_GRATIS_RULES(data?.gratis?.rules),
    },
    discounts,
    free_shipping: Boolean(data?.free_shipping),
    amount_missing_for_free_shipping:
      data?.amount_missing_for_free_shipping ?? null,
    tax_rates:
      data?.tax_rates && typeof data.tax_rates === "object" ? data.tax_rates : {},
    lines,
    errors,
    error_skus,
    billing_address,
    shipping_address,
    shipping_method: norm_method(data?.shipping_method),
    payment_method: norm_payment(data?.payment_method),
    need_full_address: Boolean(data?.need_full_address),
  };
}

export { NORM_CART, NORM_GRATIS_RULES, NORM_SHIPPING_METHODS, NORM_PAYMENT_METHODS };
export type {
  RawCart,
  Cart,
  CartLine,
  CartDiscount,
  CartError,
  CartGratis,
  GratisRule,
  CartAddress,
  ShippingMethod,
  PaymentMethod,
};
