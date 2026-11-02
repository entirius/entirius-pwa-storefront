// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { asks_stock, buy_block, sold_online, type BuyTarget } from "./buy-rules";

const fixed = { gross: "549.00", currency: "EUR" };
const from = { gross: "549.00", currency: "EUR", from: true as const };

describe("buy_block", () => {
  it.each<[string | undefined, BuyTarget, ReturnType<typeof buy_block>]>([
    ["SIMPLE", { quantity: 3, price: fixed }, null],
    ["SIMPLE", { quantity: 0, price: fixed }, "quantity"],
    ["SIMPLE", { price: fixed }, null],
    ["SIMPLE", { quantity: 3, price: null }, "price"],
    // The stock is told before the price.
    ["SIMPLE", { quantity: 0, price: null }, "quantity"],
    ["BUNDLE", { quantity: 2, price: fixed }, null],
    ["BUNDLE", { quantity: 0, price: fixed }, "quantity"],
    // A span is not a price to pay, whatever the type.
    ["BUNDLE", { quantity: 2, price: from }, "price"],
    ["CONFIGURABLE", { price: from }, "variant"],
    // The chosen variant answers for stock and price, even with a parent priced like a single product.
    ["CONFIGURABLE", { variant: false, quantity: 5, price: fixed }, "variant"],
    ["CONFIGURABLE", { variant: true, quantity: 5, price: fixed }, null],
    ["CONFIGURABLE", { variant: true, quantity: 0, price: fixed }, "quantity"],
    ["CONFIGURABLE", { variant: true, quantity: 5, price: null }, "price"],
    // Priced or not, in stock or not: an offer, never the cart.
    ["CUSTOM", { quantity: 5, price: fixed }, "enquiry"],
    ["CUSTOM", { price: null }, "enquiry"],
    [undefined, { quantity: 5, price: fixed }, "enquiry"],
    ["VIRTUAL", { quantity: 5, price: fixed }, "enquiry"],
  ])("%s %o → %s", (type, target, block) => {
    expect(buy_block(type, target)).toBe(block);
  });
});

describe("asks_stock", () => {
  it("is false only for types that never go to the cart", () => {
    expect(["SIMPLE", "BUNDLE", "CONFIGURABLE"].every(asks_stock)).toBe(true);
    expect(asks_stock("CUSTOM")).toBe(false);
    expect(asks_stock(undefined)).toBe(false);
  });
});

describe("sold_online", () => {
  it("is lost to the type or the price, not to the stock or the variant choice", () => {
    expect([null, "quantity", "variant"].map((b) => sold_online(b as ReturnType<typeof buy_block>))).toEqual([true, true, true]);
    expect(sold_online("enquiry")).toBe(false);
    expect(sold_online("price")).toBe(false);
  });
});
