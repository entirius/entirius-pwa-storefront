// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { CreditCard, Package, Receipt, Truck } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Order } from "@/utils/NORMALIZERS/order.normalizer";

function SectionHeader({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <h3 className="text-sm">{children}</h3>
    </div>
  );
}

export function OrderDetails({ order }: { order: Order }) {
  const items = order.items;
  const shipping = order.shipping_address;
  const billing = order.billing_address;
  const show_billing = billing && billing.street !== shipping?.street;
  const is_free_shipping =
    Number(order.shipping_method?.total_price) === 0 &&
    Number(order.shipping_method?.normal_price) > 0;
  // base_total is the pre-discount total and already includes shipping, so it is
  // not a subtotal — the line that adds up to `total` is the net cart value.
  const saved = Number(order.base_total) - Number(order.total);

  return (
    <div className="flex flex-col gap-6">
      {/* Items */}
      {items.length > 0 && (
        <section>
          <SectionHeader icon={<Package className="size-3.5 text-primary" />}>
            Items ({items.length})
          </SectionHeader>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {items.map((item, idx) => (
              <div
                key={item.sku ?? idx}
                className={cn(
                  "px-5 py-3",
                  idx !== items.length - 1 && "border-b border-border",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-3">
                    <p className="line-clamp-2 text-sm font-bold">
                      {item.name || item.sku || "Product"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity}
                      {item.price && (
                        <>
                          {" × "}
                          {item.special_percent && item.base_price && (
                            <span className="line-through">
                              {item.base_price}
                            </span>
                          )}{" "}
                          {item.price} {order.currency_code}
                          {item.special_percent && (
                            <span className="ml-1 font-bold text-primary">
                              −{item.special_percent}%
                            </span>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-bold">
                    {item.total_price ?? item.price ?? "-"} {order.currency_code}
                  </span>
                </div>
                {item.sub_items.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1 border-l border-border pl-3">
                    {item.sub_items.map((sub, sub_idx) => (
                      <div
                        key={sub.sku ?? sub_idx}
                        className="flex items-center justify-between"
                      >
                        <span className="flex-1 truncate pr-3 text-xs text-muted-foreground">
                          {sub.option_title || `${sub.sku} (SKU)`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ×{sub.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Shipping address */}
      {shipping && (
        <section>
          <SectionHeader icon={<Truck className="size-3.5 text-primary" />}>
            Shipping address
          </SectionHeader>
          <div className="rounded-xl border border-border bg-card px-5 py-3">
            <p className="text-sm font-bold">
              {shipping.firstname} {shipping.lastname}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {shipping.street}
            </p>
            <p className="text-sm text-muted-foreground">
              {shipping.postcode} {shipping.city}, {shipping.country_code}
            </p>
            {shipping.telephone && (
              <p className="mt-1 text-xs text-muted-foreground">
                Tel: {shipping.dialling_code}
                {shipping.telephone}
              </p>
            )}
            {shipping.email && (
              <p className="text-xs text-muted-foreground">{shipping.email}</p>
            )}
            {order.shipping_method && (
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm">{order.shipping_method.name}</span>
                <span className="text-sm font-bold">
                  {is_free_shipping ? (
                    <>
                      Free{" "}
                      <span className="font-normal text-muted-foreground line-through">
                        {order.shipping_method.normal_price}{" "}
                        {order.currency_code}
                      </span>
                    </>
                  ) : (
                    `${order.shipping_method.total_price} ${order.currency_code}`
                  )}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Payment */}
      {order.payment_methods.length > 0 && (
        <section>
          <SectionHeader icon={<CreditCard className="size-3.5 text-primary" />}>
            Payment
          </SectionHeader>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {order.payment_methods.map((method, idx) => (
              <div
                key={method.code ?? idx}
                className={cn(
                  "flex items-center justify-between px-5 py-3",
                  idx !== order.payment_methods.length - 1 &&
                    "border-b border-border",
                )}
              >
                <span className="text-sm font-bold">{method.name}</span>
                {method.pay_code && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {method.pay_code}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Billing address (only if different) */}
      {show_billing && billing && (
        <section>
          <SectionHeader icon={<CreditCard className="size-3.5 text-primary" />}>
            Billing address
          </SectionHeader>
          <div className="rounded-xl border border-border bg-card px-5 py-3">
            <p className="text-sm font-bold">
              {billing.firstname} {billing.lastname}
            </p>
            {billing.company && (
              <p className="text-sm font-bold text-primary">{billing.company}</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">{billing.street}</p>
            <p className="text-sm text-muted-foreground">
              {billing.postcode} {billing.city}, {billing.country_code}
            </p>
            {billing.tax_id && (
              <p className="mt-1 text-xs font-bold text-muted-foreground">
                NIP: {billing.tax_id}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Summary */}
      <section>
        <SectionHeader icon={<Receipt className="size-3.5 text-primary" />}>
          Summary
        </SectionHeader>
        <div className="rounded-xl border border-border bg-card px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Items (net)</span>
            <span className="text-sm">
              {order.total_netto} {order.currency_code}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tax</span>
            <span className="text-sm">
              {order.total_tax} {order.currency_code}
            </span>
          </div>
          {order.shipping_method && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Shipping</span>
              <span className="text-sm">
                {is_free_shipping
                  ? "Free"
                  : `${order.shipping_method.total_price} ${order.currency_code}`}
              </span>
            </div>
          )}
          <div className="my-3 border-t border-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-lg font-bold text-primary">
              {order.total} {order.currency_code}
            </span>
          </div>
          {saved > 0 && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">You saved</span>
              <span className="text-sm font-bold text-primary">
                {saved.toFixed(2)} {order.currency_code}
              </span>
            </div>
          )}
        </div>
      </section>

      {order.comment && (
        <section>
          <SectionHeader icon={<Receipt className="size-3.5 text-primary" />}>
            Comment
          </SectionHeader>
          <div className="rounded-xl border border-border bg-card px-5 py-3">
            <p className="text-sm text-muted-foreground">{order.comment}</p>
          </div>
        </section>
      )}
    </div>
  );
}
