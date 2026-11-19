// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ReactNode } from "react";
import { CartPageProvider, type CartPageModel } from "@entirius/storefront-sdk/cart/page";
import { useHydrated } from "@entirius/storefront-sdk/hooks";
import { price_lines } from "@entirius/storefront-sdk/i18n/price-lines";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { useAuth } from "@/providers/auth.provider";
import { useCartSync } from "@/stores/use-cart-sync";
import { unit_price } from "@/app/_components/order/cart-price";
import { DiscountCode } from "@/app/_components/order/discount-code.client";
import { CartAlerts } from "@/app/_components/order/cart-alerts";
import { GiftCard, GiftLine, gift_rule } from "@/app/_components/order/cart-gifts.client";
import { useCartGifts, useGiftSetter } from "@/app/_components/order/use-cart-gifts";
import { order_steps } from "@/app/[customer_country]/checkout/_components/checkout-stepper";
import { OrderTotals } from "@/app/_components/order/order-totals";

const SOFT_MAX = 99;
// The stepper stops at the real-time stock. A sold-out line stays in the cart, flagged, and can only shrink;
// an unknown stock (still loading, or the call failed) gets a soft cap.
const line_max = (stock: { quantity: number } | undefined, quantity: number) =>
  typeof stock?.quantity !== "number" ? SOFT_MAX : stock.quantity > 0 ? stock.quantity : quantity;

const NO_STEPS_DONE = new Set<never>();

// The cart page's model for the theme's template (@theme/cart/cart-page): the local cart with its backend copy,
// the stock caps, the prices, and the gifts, code and totals the core renders whole.
export function CartPageRuntime({ children }: { children: ReactNode }) {
  const { backend, isFetching, error, items, stocks, setQty, remove } = useCartSync();
  const ready = useHydrated();
  const { isLoggedIn } = useAuth();
  const i18n = useI18n();
  const { t } = i18n;
  const { rules, products } = useCartGifts(backend);
  const gifts = useGiftSetter(backend);
  const currency = backend?.currency || "";

  const lines: CartPageModel["lines"] = Object.entries(items).map(([sku, item]) => {
    const line = backend?.lines[sku];
    const max = line_max(stocks?.[sku], item.quantity);
    return {
      sku,
      name: item.name,
      href: `/product/${item.url_key}`,
      picture: item.media?.[0]?.[0]?.uri,
      quantity: item.quantity,
      max,
      unit: unit_price(line, currency),
      total: line ? i18n.price(line.final_total_gross, currency) : price_lines(i18n, item.price).at(-1),
      problem:
        line?.is_limited || backend?.error_skus.has(sku)
          ? line?.status === "out_of_stock"
            ? "out_of_stock"
            : "limited"
          : null,
      set_quantity: (quantity: number) => setQty(sku, quantity, max),
      remove: () => remove(sku),
    };
  });

  const model: CartPageModel = {
    ready,
    lines,
    pieces: lines.reduce((n, line) => n + line.quantity, 0),
    logged_in: isLoggedIn,
    total: i18n.price(backend?.total_gross, currency),
    steps: order_steps(t, "cart", NO_STEPS_DONE),
    blocks: {
      alerts: <CartAlerts backend={backend} sync_failed={!!error} sync_message={t("cart.sync_error")} />,
      gift_lines: (backend?.gifts ?? []).map((line) => {
        const { code, rule } = gift_rule(backend, rules, line.sku);
        return (
          <GiftLine
            key={`gift-${line.sku}`}
            line={line}
            product={products[line.sku]}
            code={code}
            max={rule?.max_quantity ?? line.quantity}
            currency={currency}
            gifts={gifts}
          />
        );
      }),
      gift_picker: <GiftCard backend={backend} rules={rules} products={products} gifts={gifts} />,
      discount_code: <DiscountCode backend={backend} />,
      totals: <OrderTotals backend={backend} currency={currency} fetching={isFetching} shipping_pending />,
    },
  };

  return <CartPageProvider value={model}>{children}</CartPageProvider>;
}
