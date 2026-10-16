// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { CreditCard, Package, Receipt, Truck } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Order } from "@/utils/NORMALIZERS/order.normalizer";
import { useI18n } from "@/providers/i18n.provider";

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
  const i18n = useI18n();
  const { t } = i18n;
  const fmt = (v: string | number | null | undefined) => i18n.price(v, order.currency_code);
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
            {t("orders.items_heading", { count: items.length })}
          </SectionHeader>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
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
                      {item.name || item.sku || t("orders.product")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("orders.quantity", { count: item.quantity })}
                      {item.price && (
                        <>
                          {" × "}
                          {item.special_percent && item.base_price && (
                            <span className="line-through">
                              {i18n.price(item.base_price)}
                            </span>
                          )}{" "}
                          {fmt(item.price)}
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
                    {fmt(item.total_price ?? item.price)}
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
                          {sub.option_title || t("orders.sub_item_sku", { sku: String(sub.sku) })}
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
            {t("checkout.shipping_address")}
          </SectionHeader>
          <div className="surface-outline bg-card">
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
                {t("orders.phone", { value: `${shipping.dialling_code}${shipping.telephone}` })}
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
                      {t("common.free")}{" "}
                      <span className="font-normal text-muted-foreground line-through">
                        {fmt(order.shipping_method.normal_price)}
                      </span>
                    </>
                  ) : (
                    fmt(order.shipping_method.total_price)
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
            {t("orders.payment")}
          </SectionHeader>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
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
            {t("checkout.billing_address")}
          </SectionHeader>
          <div className="surface-outline bg-card">
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
                {t("address.tax_id_line", { value: billing.tax_id })}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Summary */}
      <section>
        <SectionHeader icon={<Receipt className="size-3.5 text-primary" />}>
          {t("orders.summary")}
        </SectionHeader>
        <div className="surface-outline bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("orders.items_net")}</span>
            <span className="text-sm">
              {fmt(order.total_netto)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("orders.tax")}</span>
            <span className="text-sm">
              {fmt(order.total_tax)}
            </span>
          </div>
          {order.shipping_method && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("orders.shipping")}</span>
              <span className="text-sm">
                {is_free_shipping
                  ? t("common.free")
                  : fmt(order.shipping_method.total_price)}
              </span>
            </div>
          )}
          <div className="my-3 border-t border-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{t("orders.total")}</span>
            <span className="text-lg font-bold text-primary">
              {fmt(order.total)}
            </span>
          </div>
          {saved > 0 && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("orders.you_saved")}</span>
              <span className="text-sm font-bold text-primary">
                {fmt(saved)}
              </span>
            </div>
          )}
        </div>
      </section>

      {order.comment && (
        <section>
          <SectionHeader icon={<Receipt className="size-3.5 text-primary" />}>
            {t("orders.comment")}
          </SectionHeader>
          <div className="surface-outline bg-card">
            <p className="text-sm text-muted-foreground">{order.comment}</p>
          </div>
        </section>
      )}
    </div>
  );
}
