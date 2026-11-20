// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// What the account pages show, worked out by the core: prices and dates already formatted in the page language.

// An order's status: its label, and its tone, which the theme gives a colour.
export type OrderTone = "notice" | "positive" | "negative" | "informative" | "neutral";
export type OrderStatusModel = { label: string; tone: OrderTone };

// An order on a list.
export type OrderSummaryModel = {
  id: string;
  href: string;
  date: string;
  // Pieces in the order.
  items: number;
  status: OrderStatusModel;
  total: string;
};

// An address as lines: `city` is "postcode city, country"; `phone` with its dialling code.
export type AddressLinesModel = {
  name: string;
  company: string | null;
  tax_id: string | null;
  street: string;
  city: string;
  phone: string | null;
  email: string | null;
};

// A line of an order: the unit price with the regular one struck and the discount when reduced.
export type OrderLineModel = {
  name: string;
  quantity: number;
  unit: { price: string; regular: string | null; percent: string | null } | null;
  total: string;
  // A bundle's parts or a configured product's options.
  sub_items: { label: string; quantity: number }[];
};

export type OrderModel = {
  id: string;
  date: string | null;
  status: OrderStatusModel;
  lines: OrderLineModel[];
  shipping_address: AddressLinesModel | null;
  // `free`: free of charge although it has a price (`regular`, struck).
  shipping: { name: string; point: string | null; price: string; free: boolean; regular: string | null } | null;
  payments: { name: string; pay_code: string | null }[];
  // Only when it differs from the shipping address.
  billing_address: AddressLinesModel | null;
  summary: { net: string; tax: string; shipping: string | null; free_shipping: boolean; total: string; saved: string | null };
  comment: string | null;
};

// A page answering a link from an email (account activation, password reset, newsletter, back in stock): pending
// while the core sends the link's token, then the result and a way back.
export type MessagePageProps = {
  pending: boolean;
  pending_text?: string;
  title?: string;
  text?: string;
  action?: { label: string; href: string };
};
