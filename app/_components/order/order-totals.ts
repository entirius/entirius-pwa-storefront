// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { OrderTotalsModel } from "@entirius/storefront-sdk/cart";
import type { I18n } from "@entirius/storefront-sdk/i18n";
import type { Cart } from "@/utils/NORMALIZERS/cart.normalizer";

const num = (v: string | null | undefined) => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

// A backend amount worth a row: present and not zero.
const has_amount = (v: string | null | undefined) => num(v) !== 0;

// The synced backend cart's totals for the theme's OrderTotals (`@theme/order/order-totals`): subtotal, savings,
// gifts, discount codes, delivery, fee, total. `delivery_at_checkout`: the cart page, where delivery is chosen later.
export function order_totals(
  backend: Cart | null | undefined,
  currency: string,
  i18n: I18n,
  { fetching = false, delivery_at_checkout = false }: { fetching?: boolean; delivery_at_checkout?: boolean } = {},
): OrderTotalsModel {
  const fmt = (v: string | null | undefined) => i18n.price(v, backend?.currency || currency);
  const codes = (backend?.discounts ?? [])
    .filter((d) => d.status === "valid" && d.code && !d.gratis_sku)
    .map((d) => d.code);
  const has_shipping = !!backend?.shipping_method && backend.shipping_gross != null;
  return {
    fetching,
    subtotal: fmt(backend?.items_subtotal_gross),
    savings: has_amount(backend?.item_savings_gross) ? fmt(backend?.item_savings_gross) : null,
    gifts: backend?.gifts.length
      ? { price: fmt(backend.gifts_total_gross), free: num(backend.gifts_total_gross) === 0 }
      : null,
    discount: has_amount(backend?.total_discount_gross)
      ? {
          label: codes.length
            ? i18n.t("checkout.discount_codes", { codes: codes.join(", ") })
            : i18n.t("checkout.discount"),
          amount: fmt(backend?.total_discount_gross),
        }
      : null,
    delivery: has_shipping ? { price: fmt(backend?.shipping_gross), free: num(backend?.shipping_gross) === 0 } : null,
    delivery_at_checkout: !has_shipping && delivery_at_checkout,
    fee: num(backend?.fee_gross) > 0 ? fmt(backend?.fee_gross) : null,
    free_shipping_away: has_amount(backend?.amount_missing_for_free_shipping)
      ? fmt(backend?.amount_missing_for_free_shipping)
      : null,
    total: fmt(backend?.total_gross),
    vat: backend?.total_tax ? fmt(backend.total_tax) : null,
  };
}
