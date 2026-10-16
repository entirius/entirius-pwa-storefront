// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useHydrated } from "@/lib/use-hydrated";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/ui/media-image.client";
import { price_lines } from "@/lib/i18n/price-lines";
import { useI18n } from "@/providers/i18n.provider";
import { useAuth } from "@/providers/auth.provider";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { LinkDynamic } from "@/lib/link-dynamic";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import { useCartSync } from "@/stores/use-cart-sync";
import type { CartItem } from "@/stores/cart.store";
import type { Cart } from "@/utils/NORMALIZERS/cart.normalizer";
import { UnitPrice } from "@/app/_components/layout/cart-price";
import { DiscountCode } from "@/app/_components/layout/discount-code.client";
import { CartAlerts } from "@/app/_components/order/cart-alerts";
import { CheckoutStepper } from "@/app/[customer_country]/checkout/_components/checkout-stepper";
import { OrderSummaryCard, OrderTotals } from "@/app/_components/order/order-totals";
import { EmptyCart, OrderPageHeader } from "@/app/_components/order/page-header";

const SOFT_MAX = 99;
const line_max = (stock: { quantity: number } | undefined) =>
  typeof stock?.quantity === "number" && stock.quantity > 0 ? stock.quantity : SOFT_MAX;

// Same frame as checkout: title, stepper, then a list column and a 20rem summary column.
export function CartPageClient() {
  const { backend, isFetching, error, items, stocks, setQty, remove } = useCartSync();
  const mounted = useHydrated();
  const { isLoggedIn } = useAuth();
  const i18n = useI18n();
  const { t } = i18n;

  const entries = Object.entries(items);
  const pieces = entries.reduce((n, [, item]) => n + item.quantity, 0);
  const currency = backend?.currency || "";
  const has_items = mounted && entries.length > 0;

  return (
    <div className="mx-auto max-w-5xl pt-4 pb-28 lg:pb-4">
      <OrderPageHeader
        title={t("cart.page_title")}
        meta={has_items ? t("cart.items_count", { count: pieces }) : undefined}
      />
      <CheckoutStepper current="cart" completed={new Set()} />

      <div className="mt-8">
        {!mounted ? (
          // Local storage is read after mount: hold the place of the list instead of a spinner.
          <ListSkeleton />
        ) : entries.length === 0 ? (
          <EmptyCart
            message={t("cart.empty")}
            action={t("cart.start_shopping")}
            hint={isLoggedIn ? undefined : t("cart.empty_hint")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <section aria-label={t("cart.items_label")} className="flex min-w-0 flex-col gap-4">
              <CartAlerts backend={backend} sync_failed={!!error} sync_message={t("cart.sync_error")} />
              <ul className="flex flex-col divide-y rounded-lg border px-4">
                {entries.map(([sku, item]) => (
                  <CartLine
                    key={sku}
                    sku={sku}
                    item={item}
                    backend={backend}
                    max={line_max(stocks?.[sku])}
                    onQty={(q) => setQty(sku, q, line_max(stocks?.[sku]))}
                    onRemove={() => remove(sku)}
                  />
                ))}
              </ul>
              <LinkDynamic href="/" className="link self-start text-sm font-semibold">
                {t("common.continue_shopping")}
              </LinkDynamic>
            </section>

            <OrderSummaryCard className="lg:sticky lg:top-24">
              <div className="border-t pt-4">
                <DiscountCode backend={backend} />
              </div>
              <div className="border-t pt-4">
                <OrderTotals backend={backend} currency={currency} fetching={isFetching} shipping_pending />
              </div>
              <Button size="lg" className="hidden h-12 text-base lg:inline-flex" asChild>
                <LinkDynamic href="/checkout">{t("cart.go_to_checkout")}</LinkDynamic>
              </Button>
            </OrderSummaryCard>
          </div>
        )}
      </div>

      {/* Phones and tablets: total and checkout always in reach. */}
      {has_items && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-border bg-card px-4 pt-3 pb-5 lg:hidden">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{t("cart.total_incl_vat")}</p>
            <p className="text-base font-semibold tabular-nums">{i18n.price(backend?.total_gross, currency)}</p>
          </div>
          <Button size="lg" className="h-12 px-6" asChild>
            <LinkDynamic href="/checkout">{t("cart.go_to_checkout")}</LinkDynamic>
          </Button>
        </div>
      )}
    </div>
  );
}

// One line: picture, then name / unit price / availability with the line total on the right,
// and quantity + remove under them. The total keeps one column, so amounts line up across lines.
function CartLine({
  sku,
  item,
  backend,
  max,
  onQty,
  onRemove,
}: {
  sku: string;
  item: CartItem;
  backend: Cart | null | undefined;
  max: number;
  onQty: (quantity: number) => void;
  onRemove: () => void;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const currency = backend?.currency || "";
  const line = backend?.lines[sku];
  const flagged = line?.is_limited || backend?.error_skus.has(sku);
  const line_total = line ? i18n.price(line.final_total_gross, currency) : price_lines(i18n, item.price).at(-1);
  const href = `/product/${item.url_key}`;

  return (
    <li className="flex gap-4 py-4">
      <LinkDynamic
        href={href}
        className="relative aspect-product w-20 shrink-0 self-start overflow-hidden rounded-md bg-muted md:w-24"
        tabIndex={-1}
        aria-hidden
      >
        <MediaImage
          src={item.media?.[0]?.[0]?.uri ?? image_placeholder}
          alt=""
          fill
          sizes="96px"
          className="object-cover"
        />
      </LinkDynamic>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <LinkDynamic href={href} className="text-base font-medium leading-snug text-heading hover:underline">
              {item.name}
            </LinkDynamic>
            {line && <UnitPrice line={line} currency={currency} className="text-sm text-muted-foreground" />}
            {flagged && (
              <p className="text-xs text-destructive">
                {line?.status === "out_of_stock" ? t("product.out_of_stock") : t("cart.limited")}
              </p>
            )}
          </div>
          <span className="shrink-0 text-right text-base font-medium tabular-nums">{line_total}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <QuantityStepper value={item.quantity} onChange={onQty} min={0} max={max} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="relative touch-target text-muted-foreground"
            aria-label={t("cart.remove", { name: item.name })}
            onClick={onRemove}
          >
            <Trash2 aria-hidden />
            <span className="hidden md:inline">{t("cart.remove_short")}</span>
          </Button>
        </div>
      </div>
    </li>
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
