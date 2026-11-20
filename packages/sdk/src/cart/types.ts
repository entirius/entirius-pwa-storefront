// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// An amount as the API gives it ("12.50") or a number; formatted only through price().
export type Amount = string | number;

// One step of the order path (the cart, then the checkout's steps), worked out by the core.
export type OrderStep = {
  key: string;
  label: string;
  state: "done" | "current" | "next";
  // A done step leads back: a checkout step through `go`, the cart through `href`.
  go?: () => void;
  href?: string;
};

// A per-unit price: `regular` is struck when a special price applies (then `final` is lower).
export type UnitPriceData = {
  regular: Amount | null;
  final: Amount;
  percent_off: number | null;
  currency: string;
};

// The order's totals as the cart and checkout show them, formatted by the core. A row that does not apply is null;
// the theme prints savings and a discount as minus amounts.
export type OrderTotalsModel = {
  // The backend is recounting the cart.
  fetching: boolean;
  subtotal: string;
  savings: string | null;
  gifts: { price: string; free: boolean } | null;
  // `label` names the codes when there are any.
  discount: { label: string; amount: string } | null;
  delivery: { price: string; free: boolean } | null;
  // The cart page, where delivery is chosen later, says so instead of a delivery row.
  delivery_at_checkout: boolean;
  fee: string | null;
  // What is still missing for free delivery.
  free_shipping_away: string | null;
  total: string;
  vat: string | null;
};

// The cart's problems above the cart page's list and the checkout steps: a failed sync, and every line the backend
// refuses (out of stock, over the limit...), as sentences.
export type CartAlertsModel = { sync: string | null; problems: string[] };

// A gift line of the cart (and of checkout's summary): `unit` and `total` read "Free" at zero; `regular`: the struck
// list price. `edit`: its quantity and removal while the rule it came through is on the cart, null where it is
// read-only (checkout, a gift without its rule).
export type GiftLineModel = {
  sku: string;
  name: string;
  href: string | null;
  picture: string | undefined;
  regular: string | null;
  unit: string;
  total: string;
  quantity: number;
  edit: { max: number; set_quantity: (quantity: number) => void; remove: () => void; pending: boolean } | null;
};

// The gift card under the cart lines: how much is missing to the next tier (`progress` 0–100), a gift the last change
// dropped, and each rule's gifts to pick one of (`picked`: the chosen SKU, "" for none).
export type GiftPickerModel = {
  away: string | null;
  progress: number;
  removed: boolean;
  failed: boolean;
  offers: {
    code: string;
    max: number;
    picked: string;
    pending: boolean;
    choose: (sku: string) => void;
    items: { sku: string; name: string; picture: string | undefined; regular: string | null; price: string }[];
  }[];
};
