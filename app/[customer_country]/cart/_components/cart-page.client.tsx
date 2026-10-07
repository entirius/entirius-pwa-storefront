// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useHydrated } from "@/lib/use-hydrated";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MediaImage } from "@/components/ui/media-image.client";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { LinkDynamic } from "@/lib/link-dynamic";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import { useCartSync } from "@/stores/use-cart-sync";
import { UnitPrice } from "@/app/_components/layout/cart-price";
import { DiscountCode } from "@/app/_components/layout/discount-code.client";
import { CheckoutStepper } from "@/app/[customer_country]/checkout/_components/checkout-stepper";

const num = (v: string | null | undefined) => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

// No per-line live stock: the stepper soft-clamps and the backend validation
// flags catch the rest.
const SOFT_MAX = 99;

// The cart as a page: lines on the left, the order summary beside them (below on
// phones, with the total and "Go to checkout" pinned to the bottom).
export function CartPageClient() {
  const { backend, isFetching, error, items, setQty, remove } = useCartSync();
  const mounted = useHydrated();

  const entries = Object.entries(items);
  const pieces = entries.reduce((n, [, item]) => n + item.quantity, 0);
  const currency = backend?.currency || "";
  const fmt = (v: string | null | undefined) => (v == null ? "—" : `${v} ${currency}`.trim());
  const validation_ok = backend?.validation_status === "valid";
  const total_savings = num(backend?.item_savings_gross) + num(backend?.total_discount_gross);
  const applied_codes = (backend?.discounts ?? [])
    .filter((d) => d.status === "valid" && d.code)
    .map((d) => d.code);
  const has_discount = !!backend?.total_discount_gross && backend.total_discount_gross !== "0.00";
  const to_free_shipping =
    backend?.amount_missing_for_free_shipping &&
    backend.amount_missing_for_free_shipping !== "0.00"
      ? backend.amount_missing_for_free_shipping
      : null;

  const heading = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl md:text-5xl">Your cart</h1>
        {mounted && entries.length > 0 && (
          <p className="mt-1 text-muted-foreground">
            {pieces} {pieces === 1 ? "item" : "items"}
          </p>
        )}
      </div>
      <CheckoutStepper current="cart" completed={new Set()} locked={new Set()} />
    </div>
  );

  // Local storage is read after mount; until then nothing to say.
  if (!mounted) {
    return (
      <div className="flex flex-col gap-6 py-4">
        {heading}
        <Spinner className="size-6" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col gap-6 py-4">
        {heading}
        <div className="flex flex-col items-start gap-4 rounded-3xl bg-card p-8">
          <p className="text-lg text-heading">Your cart is empty</p>
          <Button className="rounded-full" asChild>
            <LinkDynamic href="/">Start shopping</LinkDynamic>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4 pb-28 lg:pb-4">
      {heading}

      {error && (
        <p className="rounded-2xl border border-destructive/50 bg-destructive-surface px-4 py-3 text-sm text-destructive">
          Couldn’t sync with the server. Showing local items.
        </p>
      )}
      {backend && !validation_ok && backend.errors.length > 0 && (
        <p className="rounded-2xl border border-destructive/50 bg-destructive-surface px-4 py-3 text-sm text-destructive">
          Some items need attention before checkout.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <section aria-label="Items in your cart" className="flex flex-col gap-3">
          <ul className="flex flex-col gap-3">
            {entries.map(([sku, item]) => {
              const line = backend?.lines[sku];
              const flagged = line?.is_limited || backend?.error_skus.has(sku);
              const line_total = line
                ? fmt(line.final_total_gross)
                : (item.price[item.price.length - 1] ?? "—");
              return (
                <li
                  key={sku}
                  className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 rounded-3xl bg-card p-4 md:grid-cols-[6.5rem_minmax(0,1fr)_auto] md:items-center"
                >
                  <LinkDynamic
                    href={`/product/${item.url_key}`}
                    className="relative aspect-square overflow-hidden rounded-2xl bg-muted"
                    tabIndex={-1}
                    aria-hidden
                  >
                    <MediaImage
                      src={item.media?.[0]?.[0]?.uri ?? image_placeholder}
                      alt=""
                      fill
                      sizes="104px"
                      className="object-cover"
                    />
                  </LinkDynamic>
                  <div className="flex min-w-0 flex-col gap-1">
                    <LinkDynamic
                      href={`/product/${item.url_key}`}
                      className="font-brand text-lg leading-snug text-heading hover:underline"
                    >
                      {item.name}
                    </LinkDynamic>
                    {line && <UnitPrice line={line} currency={currency} className="text-sm" />}
                    {flagged && (
                      <span className="self-start rounded-full bg-notice-surface px-2.5 py-0.5 text-xs font-semibold text-notice">
                        {line?.status === "out_of_stock" ? "Out of stock" : "Limited availability"}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center justify-between gap-4 border-t border-border pt-3 md:col-span-1 md:border-0 md:pt-0">
                    <QuantityStepper
                      size="lg"
                      value={item.quantity}
                      onChange={(q) => setQty(sku, q, SOFT_MAX)}
                      min={0}
                      max={SOFT_MAX}
                    />
                    <div className="flex items-center gap-2 md:min-w-36 md:flex-col md:items-end md:gap-0">
                      <span className="font-brand text-lg tabular-nums text-heading">{line_total}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-muted-foreground"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => remove(sku)}
                      >
                        <Trash2 aria-hidden />
                        <span className="hidden md:inline">Remove</span>
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <LinkDynamic href="/" className="link mt-2 self-start font-semibold">
            Continue shopping
          </LinkDynamic>
        </section>

        <aside
          aria-label="Order summary"
          className="flex flex-col gap-4 rounded-4xl bg-card p-6 lg:sticky lg:top-24"
        >
          <h2 className="text-2xl">Order summary</h2>
          <DiscountCode backend={backend} />
          <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                Subtotal
                {isFetching && <Spinner className="size-3" />}
              </dt>
              <dd className="tabular-nums">{fmt(backend?.subtotal_gross)}</dd>
            </div>
            {has_discount && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  {applied_codes.length ? `Discount (${applied_codes.join(", ")})` : "Discount"}
                </dt>
                <dd className="tabular-nums text-positive">−{fmt(backend?.total_discount_gross)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="text-muted-foreground">Calculated at checkout</dd>
            </div>
          </dl>
          {to_free_shipping && (
            <p className="-mt-2 text-xs text-muted-foreground">
              {fmt(to_free_shipping)} away from free shipping
            </p>
          )}
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
            <span className="font-semibold text-heading">Total</span>
            <span className="font-brand text-3xl tabular-nums text-heading">{fmt(backend?.total_gross)}</span>
          </div>
          {backend?.total_tax && (
            <p className="-mt-3 text-right text-sm text-muted-foreground">
              incl. VAT {fmt(backend.total_tax)}
            </p>
          )}
          {total_savings > 0.005 && (
            <p className="rounded-2xl bg-positive-surface px-4 py-2.5 text-sm font-semibold text-positive">
              You save {fmt(total_savings.toFixed(2))} on this order
            </p>
          )}
          <Button size="lg" className="hidden h-12 rounded-full text-base lg:inline-flex" asChild>
            <LinkDynamic href="/checkout">Go to checkout</LinkDynamic>
          </Button>
        </aside>
      </div>

      {/* Phones and tablets: total and checkout always in reach. */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-border bg-card px-4 pt-3 pb-5 lg:hidden">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Total incl. VAT</p>
          <p className="font-brand text-xl tabular-nums text-heading">{fmt(backend?.total_gross)}</p>
        </div>
        <Button size="lg" className="h-12 rounded-full px-6" asChild>
          <LinkDynamic href="/checkout">Go to checkout</LinkDynamic>
        </Button>
      </div>
    </div>
  );
}
