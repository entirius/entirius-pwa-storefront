// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type {
  AddressLinesModel,
  OrderLineModel,
  OrderModel,
  OrderStatusModel,
  OrderSummaryModel,
} from "@entirius/storefront-sdk/account";
import type { I18n } from "@entirius/storefront-sdk/i18n";
import {
  format_order_date,
  status_tone,
  type Order,
  type OrderAddress,
  type OrderItem,
  type OrderSummary,
} from "@/utils/NORMALIZERS/order.normalizer";
import { point_address } from "@/utils/NORMALIZERS/delivery-point.normalizer";
import type { CustomerAddress } from "@/app/[customer_country]/profile/addresses/api.query";

// The customer's orders and addresses → what the theme's account parts show (`@entirius/storefront-sdk/account`):
// prices, dates and status labels in the page language.

const status = (order: Pick<Order, "status" | "status_label">, i18n: I18n): OrderStatusModel => ({
  label: i18n.text(order.status_label),
  tone: status_tone(order.status),
});

export const order_path = (id: string) => `/profile/orders/${id}`;

export function order_summary_model(order: OrderSummary, i18n: I18n): OrderSummaryModel {
  return {
    id: order.id,
    href: order_path(order.id),
    date: format_order_date(order.created, i18n.language),
    items: order.item_count,
    status: status(order, i18n),
    total: i18n.price(order.total, order.currency_code),
  };
}

type AddressFields = Pick<OrderAddress, "firstname" | "lastname" | "street" | "postcode" | "city" | "country_code"> &
  Partial<Pick<OrderAddress, "dialling_code" | "telephone" | "email" | "company" | "tax_id">>;

export function address_lines(address: AddressFields, { company = true } = {}): AddressLinesModel {
  return {
    name: `${address.firstname} ${address.lastname}`.trim(),
    company: (company && address.company) || null,
    tax_id: address.tax_id || null,
    street: address.street,
    city: `${address.postcode} ${address.city}, ${address.country_code}`,
    phone: address.telephone ? `${address.dialling_code ?? ""} ${address.telephone}`.trim() : null,
    email: address.email || null,
  };
}

// A saved address: the company line only for a company address.
export const customer_address_lines = (address: CustomerAddress): AddressLinesModel =>
  address_lines(address, { company: address.is_company });

function line_model(item: OrderItem, i18n: I18n, currency: string, t: I18n["t"]): OrderLineModel {
  return {
    name: item.name || item.sku || t("orders.product"),
    quantity: item.quantity,
    unit: item.price
      ? {
          price: i18n.price(item.price, currency),
          regular: item.special_percent && item.base_price ? i18n.price(item.base_price) : null,
          percent: item.special_percent ? String(item.special_percent) : null,
        }
      : null,
    total: i18n.price(item.total_price ?? item.price, currency),
    sub_items: item.sub_items.map((sub) => ({
      label: sub.option_title || t("orders.sub_item_sku", { sku: String(sub.sku) }),
      quantity: sub.quantity,
    })),
  };
}

export function order_model(order: Order, i18n: I18n): OrderModel {
  const price = (value: string | number | null | undefined) => i18n.price(value, order.currency_code);
  const method = order.shipping_method;
  const free_shipping = Number(method?.total_price) === 0 && Number(method?.normal_price) > 0;
  const shipping = order.shipping_address;
  const billing = order.billing_address;
  // base_total is the pre-discount total and already includes shipping, so it is not a subtotal — the line that
  // adds up to `total` is the net cart value.
  const saved = Number(order.base_total) - Number(order.total);
  return {
    id: order.id,
    date: order.created ? format_order_date(order.created, i18n.language) : null,
    status: status(order, i18n),
    lines: order.items.map((item) => line_model(item, i18n, order.currency_code, i18n.t)),
    shipping_address: shipping
      ? {
          ...address_lines(shipping),
          // The phone as one number, the way it was given.
          phone: shipping.telephone ? `${shipping.dialling_code}${shipping.telephone}` : null,
        }
      : null,
    shipping: method
      ? {
          name: method.name ?? "",
          point: method.delivery_point
            ? [method.delivery_point.name, point_address(method.delivery_point)].filter(Boolean).join(", ") || null
            : null,
          price: price(method.total_price),
          free: free_shipping,
          regular: free_shipping ? price(method.normal_price) : null,
        }
      : null,
    payments: order.payment_methods.map((payment) => ({ name: payment.name ?? "", pay_code: payment.pay_code })),
    billing_address: billing && billing.street !== shipping?.street ? address_lines(billing) : null,
    summary: {
      net: price(order.total_netto),
      tax: price(order.total_tax),
      shipping: method ? price(method.total_price) : null,
      free_shipping,
      total: price(order.total),
      saved: saved > 0 ? price(saved) : null,
    },
    comment: order.comment || null,
  };
}
