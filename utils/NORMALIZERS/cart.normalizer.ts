// Normalizes the checkout/v2 cart response (a flat object — no {meta,data}
// envelope) into the shape the cart drawer + checkout render. Prices are strings
// ("0.00"); the currency is separate.
//
// Two independent price reductions the UI must surface:
//   1. Special/sale price (per line): unit_gross -> final_unit_gross, with percent_off.
//   2. Auto-applied cart discount (discounts[] code): per-line discount_gross, summed
//      into total_discount_gross. Kicks in at qty>=2 on this channel.
// Line final_total_gross is AFTER the special price but BEFORE the code discount;
// cart total_gross is after both. `item_savings_gross` = subtotal_gross - Σfinal_total_gross
// captures the special-price saving so the two can be shown as distinct rows.

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
};

type CartDiscount = {
  code: string;
  modifier: string;
  status: string;
  is_automatic: boolean;
  free_shipping: boolean;
};

type CartError = {
  code: string;
  message: string;
  sku: string | null;
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
};

type Cart = {
  cart_id: string;
  cart_status: string;
  validation_status: string;
  currency: string;
  allowed_guest_checkout: boolean;
  subtotal_gross: string | null; // Σ list price (pre any reduction)
  total_gross: string | null; // payable (post special + code discount)
  total_tax: string | null;
  total_discount_gross: string | null; // Σ code discounts
  item_savings_gross: string | null; // Σ special-price savings (derived), null when 0
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

const num = (v: unknown) => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

const str = (v: unknown): string | null =>
  v == null || v === "" ? null : String(v);

// A cart address object → typed CartAddress, or null when absent/empty.
function norm_address(a: any): CartAddress | null {
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
function norm_method(m: any): ShippingMethod | null {
  if (!m || typeof m !== "object" || !m.code) return null;
  return {
    code: String(m.code),
    name: str(m.name) ?? String(m.code),
    // The list uses `price` or `total_price` depending on the backend build.
    price: str(m.price ?? m.total_price),
    description: str(m.description),
    free_delivery_above: str(m.free_delivery_above),
  };
}

// GET /shipping-methods/ response → ShippingMethod[]. The envelope is inconsistent
// across this API (carts are flat, but this GET may come back wrapped in { data }),
// so accept both a bare array and a { data } wrapper. Entries without a code drop.
function NORM_SHIPPING_METHODS(resp: any): ShippingMethod[] {
  const list = Array.isArray(resp) ? resp : (resp?.data ?? []);
  if (!Array.isArray(list)) return [];
  return list
    .map(norm_method)
    .filter((m): m is ShippingMethod => m !== null);
}

// One payment method entry (from the list GET or the cart's selected method).
function norm_payment(m: any): PaymentMethod | null {
  if (!m || typeof m !== "object" || !m.code) return null;
  return {
    code: String(m.code),
    name: str(m.name) ?? String(m.code),
    description: str(m.description),
    image: str(m.image),
    provider: str(m.provider),
    fee: str(m.cash_on_delivery_fee ?? m.fee),
  };
}

// GET /payment-methods/ response → PaymentMethod[]. Same dual-envelope unwrap.
function NORM_PAYMENT_METHODS(resp: any): PaymentMethod[] {
  const list = Array.isArray(resp) ? resp : (resp?.data ?? []);
  if (!Array.isArray(list)) return [];
  return list
    .map(norm_payment)
    .filter((m): m is PaymentMethod => m !== null);
}

function NORM_CART(data: any): Cart {
  const raw_items: any[] = Array.isArray(data?.items) ? data.items : [];
  const lines: Record<string, CartLine> = {};
  let sum_final = 0;
  for (const it of raw_items) {
    if (!it?.sku) continue;
    sum_final += num(it.final_total_gross);
    lines[it.sku] = {
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
    };
  }

  // Special-price saving = list subtotal − Σ line finals (before code discounts).
  const item_savings = num(data?.subtotal_gross) - sum_final;

  const raw_discounts: any[] = Array.isArray(data?.discounts)
    ? data.discounts
    : [];
  const discounts: CartDiscount[] = raw_discounts.map((d: any) => ({
    code: d?.code ?? "",
    modifier: d?.modifier ?? "",
    status: d?.status ?? "",
    is_automatic: Boolean(d?.is_automatic),
    free_shipping: Boolean(d?.free_shipping),
  }));

  const raw_errors: any[] = Array.isArray(data?._errors) ? data._errors : [];
  const errors: CartError[] = raw_errors.map((e: any) => ({
    code: e?.code ?? "UNKNOWN",
    message: e?.message ?? "",
    sku: e?.meta?.sku ?? null,
  }));
  const error_skus = new Set(
    errors.map((e) => e.sku).filter((s): s is string => Boolean(s)),
  );

  // Addresses nest under `addresses`; fall back to top-level in case the backend
  // returns them flat on some responses.
  const addresses = data?.addresses ?? {};
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
    total_gross: data?.total_gross ?? null,
    total_tax: data?.total_tax ?? null,
    total_discount_gross: data?.total_discount_gross ?? null,
    item_savings_gross: item_savings > 0.005 ? item_savings.toFixed(2) : null,
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

export { NORM_CART, NORM_SHIPPING_METHODS, NORM_PAYMENT_METHODS };
export type {
  Cart,
  CartLine,
  CartDiscount,
  CartError,
  CartAddress,
  ShippingMethod,
  PaymentMethod,
};
