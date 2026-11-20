// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { CheckoutSummaryModel } from "@entirius/storefront-sdk/checkout";
import { price_lines } from "@entirius/storefront-sdk/i18n/price-lines";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import { unit_price } from "@/app/_components/order/cart-price";
import { DiscountCode } from "@/app/_components/order/discount-code.client";
import type { Cart } from "@/utils/NORMALIZERS/cart.normalizer";
import type { CartItem } from "@/stores/cart.store";
import { order_totals } from "@/app/_components/order/order-totals";
import { gift_line } from "@/app/_components/order/cart-gifts";
import { useGiftProducts } from "@/app/_components/order/use-cart-gifts";

// Checkout's read-only summary for the theme's @theme/checkout/checkout-summary: the synced backend cart's lines
// and totals (the local line price until the first sync), the gifts' lines and the discount code whole.
export function useCheckoutSummary(
  backend: Cart | null | undefined,
  items: Record<string, CartItem>,
  currency: string,
): CheckoutSummaryModel {
  const i18n = useI18n();
  const currency_label = backend?.currency || currency;
  const gifts = backend?.gifts ?? [];
  const gift_products = useGiftProducts(gifts.map((g) => g.sku));

  return {
    lines: Object.entries(items).map(([sku, item]) => {
      const line = backend?.lines[sku];
      const flagged = line?.is_limited || backend?.error_skus.has(sku);
      return {
        sku,
        name: item.name,
        picture: item.media?.[0]?.[0]?.uri ?? image_placeholder,
        quantity: item.quantity,
        unit: unit_price(line, currency_label),
        total: line ? i18n.price(line.final_total_gross, currency_label) : price_lines(i18n, item.price).at(-1),
        problem: flagged ? (line?.status === "out_of_stock" ? "out_of_stock" : "limited") : null,
      };
    }),
    totals: order_totals(backend, currency, i18n),
    gift_lines: gifts.map((line) => gift_line(i18n, line, gift_products[line.sku], currency_label)),
    blocks: {
      discount_code: <DiscountCode backend={backend} />,
    },
  };
}
