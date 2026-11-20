// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { ReactNode } from "react";
import type { OrderTotalsModel, UnitPriceData } from "../cart/types";

// Checkout is the core's: its steps, forms, delivery, payment and the order button cannot be overridden (a theme
// must not be able to break an order). A theme draws the summary beside the steps and the page after the order.

// A line of the summary: the product, its quantity, the backend's unit price once synced, the line's total.
export type CheckoutSummaryLine = {
  sku: string;
  name: string;
  picture: string;
  quantity: number;
  unit: UnitPriceData | null;
  total: string | undefined;
  // The backend refuses the line as it is.
  problem: "out_of_stock" | "limited" | null;
};

// `@theme/checkout/checkout-summary`: the lines, the totals, and what the core renders whole: the gifts' lines and
// the discount code.
export type CheckoutSummaryModel = {
  lines: CheckoutSummaryLine[];
  totals: OrderTotalsModel;
  blocks: { gift_lines: ReactNode; discount_code: ReactNode };
};

// What the customer keeps after the order (the guest cannot read the order back): the shop, the numbers, the date,
// the amount, how to pay (`copy_text`: the transfer details to paste into a banking app) and the delivery.
export type ReceiptModel = {
  seller: string;
  numbers: string;
  date: string;
  amount: string | null;
  payment: {
    name: string;
    // The text the shop wrote for the method: HTML or plain text.
    description: { text: string; html: boolean } | null;
    copy_text: string | null;
  } | null;
  delivery: { name: string; price: { value: string; free: boolean } | null; point: string | null } | null;
};

// `@theme/checkout/success-page`: the page after the order.
export type CheckoutSuccessModel = {
  // The order number(s), or a plain thank-you without them.
  message: string;
  // The order was placed but the payment gateway did not start.
  payment_failed: boolean;
  // What to do next for a bank transfer, when the shop wrote it.
  transfer_note: string | null;
  receipt: ReceiptModel | null;
  print: () => void;
};
