// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { OrderStep, OrderTotalsModel, UnitPriceData } from "./types";

// One line of the cart: the product, its quantity within the stock, the backend's prices once synced.
export type CartLineModel = {
  sku: string;
  name: string;
  href: string;
  picture: string | undefined;
  quantity: number;
  // The stepper's top: the real-time stock (a sold-out line can only shrink), else a soft cap.
  max: number;
  // null until the backend cart has the line.
  unit: UnitPriceData | null;
  // The line's total, formatted: the backend's, or the local price before the first sync.
  total: string | undefined;
  // The backend refuses the line as it is: sold out, or over a limit.
  problem: "out_of_stock" | "limited" | null;
  set_quantity: (quantity: number) => void;
  remove: () => void;
};

// The cart page, worked out by the core (the local cart, its backend copy, the stock, gifts and codes).
export type CartPageModel = {
  // The cart lives in local storage, read after mount: until then it is unknown, not empty.
  ready: boolean;
  lines: CartLineModel[];
  // Pieces in the cart (the quantities added up).
  pieces: number;
  logged_in: boolean;
  // The total to pay incl. VAT, formatted; null before the first sync.
  total: string | null;
  // The order path with the cart as the current step.
  steps: OrderStep[];
  totals: OrderTotalsModel;
  // Parts the core renders whole for now: the theme places them. `gift_lines` are <li>s for the lines' list.
  blocks: {
    alerts: ReactNode;
    gift_lines: ReactNode;
    gift_picker: ReactNode;
    discount_code: ReactNode;
  };
};

const CartPageContext = createContext<CartPageModel | null>(null);

export function CartPageProvider({ value, children }: { value: CartPageModel; children: ReactNode }) {
  return <CartPageContext value={value}>{children}</CartPageContext>;
}

export function useCartPage(): CartPageModel {
  const page = useContext(CartPageContext);
  if (!page) throw new Error("useCartPage must be used within <CartPageProvider>");
  return page;
}
