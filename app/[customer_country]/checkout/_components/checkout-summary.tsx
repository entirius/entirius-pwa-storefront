"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import { UnitPrice } from "@/app/_components/layout/cart-price";
import type { Cart } from "@/utils/NORMALIZERS/cart.normalizer";
import type { CartItem } from "@/stores/cart.store";

// Read-only order summary (authoritative totals from the synced backend cart, local
// line-price fallback). Rendered in the sticky right column of the checkout stepper.
export function CheckoutSummary({
  backend,
  items,
  currency,
}: {
  backend: Cart | null | undefined;
  items: Record<string, CartItem>;
  currency: string;
}) {
  const entries = Object.entries(items);
  const currency_label = backend?.currency || currency;
  const fmt = (v: string | null | undefined) =>
    v == null ? "—" : `${v} ${currency_label}`.trim();
  const applied_codes = (backend?.discounts ?? [])
    .filter((d) => d.status === "valid" && d.code)
    .map((d) => d.code);
  const discount_label =
    applied_codes.length > 0
      ? `Discount (${applied_codes.join(", ")})`
      : "Discount";

  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        Order summary
      </h2>
      <div className="flex flex-col divide-y">
        {entries.map(([sku, item]) => {
          const uri = item.media?.[0]?.[0]?.uri ?? image_placeholder;
          const line = backend?.lines[sku];
          const flagged = line?.is_limited || backend?.error_skus.has(sku);
          const line_total = line
            ? fmt(line.final_total_gross)
            : (item.price[item.price.length - 1] ?? "—");
          return (
            <div key={sku} className="flex gap-3 py-3">
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
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span>Qty {item.quantity}</span>
                  {line ? (
                    <UnitPrice line={line} currency={currency_label} />
                  ) : null}
                </div>
                {flagged && (
                  <p className="text-xs text-destructive">
                    {line?.status === "out_of_stock"
                      ? "Out of stock"
                      : "Limited availability"}
                  </p>
                )}
              </div>
              <span className="text-sm font-medium tabular-nums">
                {line_total}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t pt-4 text-sm">
        <Row label="Subtotal" value={fmt(backend?.subtotal_gross)} />
        {backend?.item_savings_gross && (
          <Row
            label="Sale savings"
            value={`−${fmt(backend.item_savings_gross)}`}
            accent
          />
        )}
        {backend?.total_discount_gross &&
          backend.total_discount_gross !== "0.00" && (
            <Row
              label={discount_label}
              value={`−${fmt(backend.total_discount_gross)}`}
              accent
            />
          )}
        {backend?.amount_missing_for_free_shipping &&
          backend.amount_missing_for_free_shipping !== "0.00" && (
            <p className="text-xs text-muted-foreground">
              {fmt(backend.amount_missing_for_free_shipping)} away from free
              shipping
            </p>
          )}
        <div className="mt-1 flex items-center justify-between border-t pt-3 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{fmt(backend?.total_gross)}</span>
        </div>
        {backend?.total_tax && (
          <p className="text-right text-xs text-muted-foreground">
            incl. VAT {fmt(backend.total_tax)}
          </p>
        )}
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  const accent_cls = "text-emerald-600 dark:text-emerald-500";
  return (
    <div className="flex items-center justify-between">
      <span className={accent ? accent_cls : "text-muted-foreground"}>
        {label}
      </span>
      <span className={cn("tabular-nums", accent && accent_cls)}>{value}</span>
    </div>
  );
}
