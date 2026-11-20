// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { GiftLineModel, GiftPickerModel } from "@entirius/storefront-sdk/cart";
import type { I18n } from "@entirius/storefront-sdk/i18n";
import { price_lines } from "@entirius/storefront-sdk/i18n/price-lines";
import type { Cart, CartLine, GratisRule } from "@/utils/NORMALIZERS/cart.normalizer";
import type { GiftProduct, GiftSetter } from "@/app/_components/order/use-cart-gifts";

// The cart's gifts for the theme's views (`@theme/cart/gift-line`, `gift-picker`, `@theme/checkout/summary-gift-line`):
// the rules, the backend's prices and the gift setter stay here.

const num = (v: string | null | undefined) => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

// The gift price: "Free" at zero, else the amount.
const gift_price = (i18n: I18n, currency: string) => (amount: string | null | undefined) =>
  amount != null && num(amount) === 0 ? i18n.t("common.free") : i18n.price(amount, currency);

// The rule a gift line was picked through, and how many pieces it allows now.
export function gift_rule(backend: Cart | null | undefined, rules: GratisRule[], sku: string) {
  const code = backend?.discounts.find((d) => d.gratis_sku === sku)?.code;
  return { code, rule: rules.find((r) => r.code === code) };
}

// A gift line: editable on the cart page while its rule is on the cart (`gifts`, `rules`), read-only without them
// (checkout's summary).
export function gift_line(
  i18n: I18n,
  line: CartLine,
  product: GiftProduct | undefined,
  currency: string,
  edit?: { backend: Cart | null | undefined; rules: GratisRule[]; gifts: GiftSetter },
): GiftLineModel {
  const price = gift_price(i18n, currency);
  const { code, rule } = edit ? gift_rule(edit.backend, edit.rules, line.sku) : { code: undefined, rule: undefined };
  return {
    sku: line.sku,
    name: product?.name ?? line.sku,
    href: product ? `/product/${product.url_key}` : null,
    picture: product?.media?.[0]?.[0]?.uri,
    regular: line.unit_gross && line.unit_gross !== line.final_unit_gross ? i18n.price(line.unit_gross, currency) : null,
    unit: price(line.final_unit_gross),
    total: price(line.final_total_gross),
    quantity: line.quantity,
    edit:
      edit && code
        ? {
            max: Math.max(rule?.max_quantity ?? line.quantity, line.quantity),
            set_quantity: (quantity) => edit.gifts.set_gift(code, line.sku, quantity),
            remove: () => edit.gifts.set_gift(code, line.sku, 0),
            pending: edit.gifts.pending,
          }
        : null,
  };
}

// Under the cart lines: how much is missing to the next gift tier, and the gifts to pick from. null when the cart
// has no gratis rule in reach. Picking keeps the quantity already chosen (1 the first time).
export function gift_picker(
  i18n: I18n,
  backend: Cart | null | undefined,
  rules: GratisRule[],
  products: Record<string, GiftProduct>,
  gifts: GiftSetter,
): GiftPickerModel | null {
  const { t } = i18n;
  const currency = backend?.currency || "";
  const price = gift_price(i18n, currency);
  const missing = backend?.gratis.amount_missing;
  const nearest = backend?.gratis.nearest_tier_price;
  const in_reach = num(missing) > 0 && num(nearest) > 0;
  const offers = rules.filter((r) => r.max_quantity > 0 && r.items.length > 0);
  if (!in_reach && offers.length === 0) return null;
  const next_quantity = offers.find((r) => r.next_tier_quantity)?.next_tier_quantity;
  const amount = i18n.price(missing, currency);
  return {
    away: !in_reach
      ? null
      : next_quantity
        ? t("cart.gift_next_tier", { amount, count: next_quantity })
        : t("cart.gift_away", { amount }),
    progress: in_reach ? Math.round(((num(nearest) - num(missing)) / num(nearest)) * 100) : 100,
    // A gift the cart dropped on the last change (its total fell under the gift's tier).
    removed: !backend?.gifts.length && !!backend?.errors.some((e) => offers.some((r) => r.code === e.discount_code)),
    failed: gifts.failed,
    offers: offers.map((rule) => {
      const picked = backend?.discounts.find((d) => d.code === rule.code && d.gratis_sku);
      const quantity = Math.min(picked?.gratis_quantity ?? 1, rule.max_quantity);
      return {
        code: rule.code,
        max: rule.max_quantity,
        picked: picked?.gratis_sku ?? "",
        pending: gifts.pending,
        choose: (sku: string) => gifts.set_gift(rule.code, sku, quantity),
        items: rule.items.map((item) => {
          const product = products[item.sku];
          return {
            sku: item.sku,
            name: product?.name ?? item.sku,
            picture: product?.media?.[0]?.[0]?.uri,
            regular: product?.price ? (price_lines(i18n, product.price).at(-1) ?? null) : null,
            price: price(item.price),
          };
        }),
      };
    }),
  };
}
