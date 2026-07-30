"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SheetClose } from "@/components/ui/sheet";
import { LinkDynamic } from "@/lib/link-dynamic";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import { useCartSync } from "@/stores/use-cart-sync";
import { UnitPrice } from "./cart-price";

const num = (v: string | null | undefined) => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

// The drawer only mounts (via the Sheet portal) when opened, so useCartSync
// fires the backend sync on open and tears it down on close. No per-line live
// stock — the stepper soft-clamps and the backend validation flags catch the
// rest.
const SOFT_MAX = 99;

export function CartItems() {
  const { backend, isFetching, error, items, setQty, remove } = useCartSync();
  const entries = Object.entries(items);

  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
    );
  }

  const currency_label = backend?.currency || "";
  const fmt = (v: string | null | undefined) =>
    v == null ? "—" : `${v} ${currency_label}`.trim();
  const validation_ok = backend?.validation_status === "valid";
  // Combined savings for the compact drawer: special-price + code discounts.
  const total_savings =
    num(backend?.item_savings_gross) + num(backend?.total_discount_gross);

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      {error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Couldn’t sync with the server. Showing local items.
        </p>
      )}

      {backend && !validation_ok && backend.errors.length > 0 && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Some items need attention before checkout.
        </p>
      )}

      <div className="flex flex-col gap-3 overflow-y-auto">
        {entries.map(([sku, item]) => {
          const uri = item.media?.[0]?.[0]?.uri ?? image_placeholder;
          const line = backend?.lines[sku];
          const flagged = line?.is_limited || backend?.error_skus.has(sku);
          const line_total = line
            ? fmt(line.final_total_gross)
            : (item.price[item.price.length - 1] ?? "—");
          return (
            <div key={sku} className="flex gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={uri}
                  alt={item.name}
                  fill
                  sizes="64px"
                  className="object-cover grayscale dark:brightness-20"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                {line ? (
                  <UnitPrice
                    line={line}
                    currency={currency_label}
                    className="text-xs"
                  />
                ) : null}
                {flagged && (
                  <p className="text-xs text-destructive">
                    {line?.status === "out_of_stock"
                      ? "Out of stock"
                      : "Limited availability"}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2">
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(q) => setQty(sku, q, SOFT_MAX)}
                    min={0}
                    max={SOFT_MAX}
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium tabular-nums">
                      {line_total}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => remove(sku)}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-1 border-t pt-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-muted-foreground">
            Subtotal
            {isFetching && <Spinner className="size-3" />}
          </span>
          <span className="tabular-nums">{fmt(backend?.subtotal_gross)}</span>
        </div>
        {total_savings > 0.005 && (
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-500">
            <span>You save</span>
            <span className="tabular-nums">−{fmt(total_savings.toFixed(2))}</span>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between border-t pt-2 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{fmt(backend?.total_gross)}</span>
        </div>
        {backend?.total_tax && (
          <p className="text-right text-xs text-muted-foreground">
            incl. VAT {fmt(backend.total_tax)}
          </p>
        )}
      </div>

      <SheetClose asChild>
        <Button className="w-full" disabled={entries.length === 0} asChild>
          <LinkDynamic href="/checkout">Checkout</LinkDynamic>
        </Button>
      </SheetClose>
    </div>
  );
}
