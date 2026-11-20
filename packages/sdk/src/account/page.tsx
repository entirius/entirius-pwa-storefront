// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AddressLinesModel, OrderModel, OrderSummaryModel } from "./types";

// The account pages, worked out by the core (the session, the customer's data, the forms); every part of a template
// reads its page with the hook below. Forms with logic of their own come whole in `form`.

// The account's menu: the pages and logging out.
export type AccountMenuModel = {
  items: { id: "overview" | "orders" | "addresses"; href: string; label: string; current: boolean }[];
  log_out: () => void;
};

// The overview: details, the latest order, the default address, the password. `undefined` while loading.
export type AccountOverviewModel = {
  details: { name: string; email: string | null; editing: boolean; edit: () => void; form: ReactNode } | undefined;
  latest_order: OrderSummaryModel | null | undefined;
  address: { lines: AddressLinesModel | null; count: number } | undefined;
  password: { editing: boolean; changed: boolean; edit: () => void; form: ReactNode };
};

export type OrdersPageModel = {
  status: "loading" | "error" | "ready";
  orders: OrderSummaryModel[];
  more: { available: boolean; loading: boolean; load: () => void };
  // A developer's probe of the orders endpoint (DEBUG_MODE), else null.
  probe: ReactNode;
};

export type OrderPageModel = {
  // The number from the address until the order arrives.
  id: string;
  status: "loading" | "error" | "ready";
  order: OrderModel | null;
};

export type AddressModel = {
  id: string;
  lines: AddressLinesModel;
  is_default: boolean;
  set_default: () => void;
  edit: () => void;
  remove: () => void;
};

export type AddressesPageModel = {
  status: "loading" | "ready";
  addresses: AddressModel[];
  add: () => void;
  // The add / edit form (a sheet the core opens).
  form: ReactNode;
};

function page_context<T>(name: string) {
  const Context = createContext<T | null>(null);
  function Provider({ value, children }: { value: T; children: ReactNode }) {
    return <Context value={value}>{children}</Context>;
  }
  function use(): T {
    const value = useContext(Context);
    if (!value) throw new Error(`${name} must be used within its provider`);
    return value;
  }
  return [Provider, use] as const;
}

export const [AccountMenuProvider, useAccountMenu] = page_context<AccountMenuModel>("useAccountMenu");
export const [AccountOverviewProvider, useAccountOverview] = page_context<AccountOverviewModel>("useAccountOverview");
export const [OrdersPageProvider, useOrdersPage] = page_context<OrdersPageModel>("useOrdersPage");
export const [OrderPageProvider, useOrderPage] = page_context<OrderPageModel>("useOrderPage");
export const [AddressesPageProvider, useAddressesPage] = page_context<AddressesPageModel>("useAddressesPage");
