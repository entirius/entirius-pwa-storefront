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
      <h3 className="text-sm font-semibold">{children}</h3>
    </div>
  );
}

export function OrderDetails({ order }: { order: Order }) {
  const { t, price, country } = useI18n();
  const items = order.items;
  const shipping = order.shipping_address;
  const billing = order.billing_address;
  const show_billing = billing && billing.street !== shipping?.street;

  return (
    <div className="flex flex-col gap-6">
      {/* Items */}
      {items.length > 0 && (
        <section>
          <SectionHeader icon={<Package className="size-3.5 text-primary" />}>
            {t("orders.items_heading", { count: items.length })}
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
                      {item.name || item.sku || t("orders.product")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("orders.quantity", { count: item.quantity })}
                    </p>
                  </div>
                  <span className="text-sm font-bold">
                    {price(item.total_price ?? item.price, order.currency_code)}
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
            {t("checkout.shipping_address")}
          </SectionHeader>
          <div className="rounded-xl border border-border bg-card px-5 py-3">
            <p className="text-sm font-bold">
              {shipping.firstname} {shipping.lastname}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {shipping.street}
            </p>
            <p className="text-sm text-muted-foreground">
              {shipping.postcode} {shipping.city}, {country(shipping.country_code)}
            </p>
            {shipping.telephone && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("orders.phone", {
                  value: `${shipping.dialling_code}${shipping.telephone}`,
                })}
              </p>
            )}
            {shipping.email && (
              <p className="text-xs text-muted-foreground">{shipping.email}</p>
            )}
          </div>
        </section>
      )}

      {/* Billing address (only if different) */}
      {show_billing && billing && (
        <section>
          <SectionHeader icon={<CreditCard className="size-3.5 text-primary" />}>
            {t("checkout.billing_address")}
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
              {billing.postcode} {billing.city}, {country(billing.country_code)}
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
        <div className="rounded-xl border border-border bg-card px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("orders.subtotal")}</span>
            <span className="text-sm">
              {price(order.base_total, order.currency_code)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("orders.tax")}</span>
            <span className="text-sm">
              {price(order.total_tax, order.currency_code)}
            </span>
          </div>
          <div className="my-3 border-t border-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{t("orders.total")}</span>
            <span className="text-lg font-bold text-primary">
              {price(order.total, order.currency_code)}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
