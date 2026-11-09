// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { MessageKey } from "@/lib/i18n/translate";
import type { CheckoutStep } from "./checkout-stepper";

// `POST orders/` answers 409 when the cart cannot become an order (checkout 10.1): `{ error, message }`, where
// `error` is a stable code and `message` English text for developers. The code picks the shop's message and the
// place the customer fixes it in; an unknown code gets the generic message, never the API text.

export type RefusalFix = Exclude<CheckoutStep, "review"> | "cart";
export type OrderRefusal = { message: MessageKey; fix: RefusalFix | null };

const BY_CODE = new Map<string, OrderRefusal>([
  ["ADDRESSES_NOT_SELECTED", { message: "checkout.refused_address", fix: "address" }],
  ["SHIPPING_OPTION_NOT_SELECTED", { message: "checkout.refused_shipping", fix: "shipping" }],
  ["PAYMENT_OPTION_NOT_SELECTED", { message: "checkout.refused_payment", fix: "payment" }],
  // A method that delivers to a pickup point and no point in the cart.
  ["DELIVERY_POINT_NOT_SELECTED", { message: "checkout.refused_delivery_point", fix: "shipping" }],
  ["OUT_OF_STOCK", { message: "checkout.refused_out_of_stock", fix: "cart" }],
  // The voucher pays as a payment method, so another method is the way out (or fewer items, in the cart).
  ["VOUCHER_NOT_SUPPORTED_ON_SPLIT_ORDER", { message: "checkout.refused_voucher_split", fix: "payment" }],
]);

// A discount code or gift rule of the cart refused at order time carries the cart's own reason code
// (`DISCOUNT_EXPIRED`, `DISCOUNT_USAGE_LIMIT_REACHED`, `GRATIS_QTY_EXCEEDED`, …); the cart page shows which one.
const BY_PREFIX: [string, OrderRefusal][] = [
  ["DISCOUNT_", { message: "checkout.refused_discount", fix: "cart" }],
  ["GRATIS_", { message: "checkout.refused_gift", fix: "cart" }],
];

const UNKNOWN: OrderRefusal = { message: "checkout.order_failed", fix: null };

export const FIX_LABEL: Record<RefusalFix, MessageKey> = {
  address: "checkout.fix_address",
  shipping: "checkout.fix_shipping",
  payment: "checkout.fix_payment",
  cart: "cart.view",
};

export function order_refusal(body: unknown): OrderRefusal {
  const code = (body as { error?: unknown } | null | undefined)?.error;
  if (typeof code !== "string") return UNKNOWN;
  return BY_CODE.get(code) ?? BY_PREFIX.find(([prefix]) => code.startsWith(prefix))?.[1] ?? UNKNOWN;
}
