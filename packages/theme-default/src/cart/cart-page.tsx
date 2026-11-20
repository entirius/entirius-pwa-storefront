// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useCartPage } from "@entirius/storefront-sdk/cart/page";
import { Link } from "@entirius/storefront-sdk/components/link";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { OrderPageHeader, EmptyCart } from "@theme/order/page-header";
import { OrderSteps } from "@theme/order/order-steps";
import { CartLine } from "@theme/cart/cart-line";
import { CartSummary } from "@theme/cart/cart-summary";
import { CartBar } from "@theme/cart/cart-bar";
import { CartAlerts } from "@theme/order/cart-alerts";

// The cart page: the default arrangement of its parts, in the same frame as checkout (title, steps, then a list
// column and a 20rem summary column). Every part reads the cart from useCartPage().
export function CartPage() {
  const { t } = useI18n();
  const { ready, lines, pieces, logged_in, steps, alerts, blocks } = useCartPage();
  const has_lines = ready && lines.length > 0;

  return (
    <div className="mx-auto max-w-5xl pt-4 pb-28 lg:pb-4">
      <OrderPageHeader title={t("cart.page_title")} meta={has_lines ? t("cart.items_count", { count: pieces }) : undefined} />
      <OrderSteps steps={steps} />

      <div className="mt-8">
        {!ready ? (
          // Local storage is read after mount: hold the place of the list instead of a spinner.
          <ListSkeleton />
        ) : lines.length === 0 ? (
          <EmptyCart
            message={t("cart.empty")}
            action={t("cart.start_shopping")}
            hint={logged_in ? undefined : t("cart.empty_hint")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <section aria-label={t("cart.items_label")} className="flex min-w-0 flex-col gap-4">
              <CartAlerts alerts={alerts} />
              <ul className="flex flex-col divide-y rounded-lg border px-4">
                {lines.map((line) => (
                  <CartLine key={line.sku} line={line} />
                ))}
                {blocks.gift_lines}
              </ul>
              {blocks.gift_picker}
              <Link href="/" className="link self-start text-sm font-semibold">
                {t("common.continue_shopping")}
              </Link>
            </section>
            <CartSummary />
          </div>
        )}
      </div>

      {has_lines && <CartBar />}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div aria-hidden className="flex flex-col divide-y rounded-lg border px-4 lg:mr-[22rem]">
      {[0, 1].map((i) => (
        <div key={i} className="flex gap-4 py-4">
          <div className="aspect-product w-20 shrink-0 animate-pulse rounded-md bg-muted md:w-24" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
