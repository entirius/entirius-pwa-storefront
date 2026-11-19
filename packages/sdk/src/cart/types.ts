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
