// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { merge_cart_items } from "./cart-login";
import type { CartItem } from "./cart.store";

const item = (sku: string, quantity: number): CartItem => ({
  sku,
  name: `Product ${sku}`,
  url_key: sku.toLowerCase(),
  price: { gross: "10.00", currency: "EUR" },
  media: [],
  quantity,
});
const product = (sku: string): Omit<CartItem, "quantity"> => ({
  sku,
  name: `Product ${sku}`,
  url_key: sku.toLowerCase(),
  price: { gross: "10.00", currency: "EUR" },
  media: [],
});

describe("merge_cart_items", () => {
  it("adds the saved cart's lines to the local cart and sums a shared SKU", () => {
    const merged = merge_cart_items({ A: item("A", 1), B: item("B", 2) }, [
      { sku: "B", quantity: 3 },
      { sku: "C", quantity: 1 },
    ], { C: product("C") });
    expect(Object.fromEntries(Object.entries(merged).map(([sku, i]) => [sku, i.quantity]))).toEqual({
      A: 1,
      B: 5,
      C: 1,
    });
    expect(merged.C.name).toBe("Product C");
  });

  it("leaves out a saved line whose product is unknown or empty", () => {
    const merged = merge_cart_items({}, [
      { sku: "GONE", quantity: 1 },
      { sku: "C", quantity: 0 },
    ], { C: product("C") });
    expect(merged).toEqual({});
  });

  it("does not change the local cart object", () => {
    const local = { A: item("A", 1) };
    merge_cart_items(local, [{ sku: "A", quantity: 1 }], {});
    expect(local.A.quantity).toBe(1);
  });
});
