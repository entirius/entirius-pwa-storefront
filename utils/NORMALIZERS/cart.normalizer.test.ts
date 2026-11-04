// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { NORM_CART, NORM_GRATIS_RULES } from "./cart.normalizer";

const item = {
  sku: "A",
  quantity: 2,
  status: "valid",
  unit_gross: "50.00",
  total_gross: "100.00",
  final_unit_gross: "40.00",
  final_total_gross: "80.00",
};

describe("NORM_CART totals", () => {
  it("sums the items without delivery, even when the backend subtotal includes it", () => {
    const cart = NORM_CART({
      subtotal_gross: "112.00",
      total_gross: "92.00",
      items: [item],
      shipping_method: { code: "post", name: "Post", price: "12.00", final_gross: "12.00" },
    });
    expect(cart.items_subtotal_gross).toBe("100.00");
    expect(cart.item_savings_gross).toBe("20.00");
    expect(cart.shipping_gross).toBe("12.00");
  });

  it("takes the delivery price after free delivery, not the method's base price", () => {
    // The shape of the cart's method on the reference backend: `gross` before, `final_gross` after free delivery.
    const cart = NORM_CART({
      free_shipping: true,
      items: [item],
      shipping_method: { code: "std", name: "Standard", price: "9.99", gross: "9.99", final_gross: "0.00" },
    });
    expect(cart.shipping_gross).toBe("0.00");
  });

  it("falls back to unit price times quantity and to the backend subtotal", () => {
    const no_total: Partial<typeof item> = { ...item };
    delete no_total.total_gross;
    expect(NORM_CART({ items: [no_total] }).items_subtotal_gross).toBe("100.00");
    expect(NORM_CART({ subtotal_gross: "7.00", items: [] }).items_subtotal_gross).toBe("7.00");
  });

  it("reads delivery and payment fee only when present", () => {
    const cart = NORM_CART({ items: [item], payment_method: { code: "cod", fee_gross: "5.00" } });
    expect(cart.shipping_gross).toBeNull();
    expect(cart.fee_gross).toBe("5.00");
  });
});

describe("NORM_CART gifts", () => {
  // The shapes answered by checkout 10 for a 638 EUR cart with two gift pieces picked.
  const gift = {
    sku: "G",
    quantity: 2,
    status: "valid",
    is_gratis: true,
    unit_gross: "269.00",
    total_gross: "538.00",
    final_unit_gross: "2.69",
    final_total_gross: "5.38",
  };

  it("keeps gift lines apart from the lines, the subtotal and the savings", () => {
    const cart = NORM_CART({ total_gross: "85.38", items: [item, gift] });
    expect(Object.keys(cart.lines)).toEqual(["A"]);
    expect(cart.gifts.map((g) => [g.sku, g.quantity, g.final_unit_gross])).toEqual([["G", 2, "2.69"]]);
    expect(cart.items_subtotal_gross).toBe("100.00");
    expect(cart.item_savings_gross).toBe("20.00");
    expect(cart.gifts_total_gross).toBe("5.38");
  });

  it("keeps a gift whose SKU is also a bought line", () => {
    const cart = NORM_CART({ items: [item, { ...gift, sku: "A" }] });
    expect(cart.lines.A.final_total_gross).toBe("80.00");
    expect(cart.gifts.map((g) => g.sku)).toEqual(["A"]);
  });

  it("has no gifts total without gifts", () => {
    expect(NORM_CART({ items: [item] }).gifts_total_gross).toBeNull();
  });

  it("reads the picked gift of a code and the gratis summary", () => {
    const cart = NORM_CART({
      items: [item],
      discounts: [
        { code: "GRATIS_STEP", modifier: "gratis_stepped", status: "valid", is_automatic: false, gratis_sku: "G", gratis_quantity: 2 },
        { code: "PERCENT10", modifier: "percent_discount", status: "valid", is_automatic: false },
      ],
      gratis: { is_available: true, nearest_tier_price: "1000.00", amount_missing: "362.00", rules: [] },
    });
    expect(cart.discounts.map((d) => [d.code, d.gratis_sku, d.gratis_quantity])).toEqual([
      ["GRATIS_STEP", "G", 2],
      ["PERCENT10", null, null],
    ]);
    expect(cart.gratis).toEqual({ is_available: true, nearest_tier_price: "1000.00", amount_missing: "362.00" });
  });

  it("tells a refused code from an item problem", () => {
    const cart = NORM_CART({
      _errors: [
        { scope: "discounts", code: "DISCOUNT_CODE_INVALID", message: "x", meta: { code: "GRATIS_STEP" } },
        { scope: "items", code: "ITEM_QTY_CHANGED", message: "x", meta: { sku: "A" } },
      ],
    });
    expect(cart.errors.map((e) => [e.scope, e.discount_code, e.sku])).toEqual([
      ["discounts", "GRATIS_STEP", null],
      ["items", null, "A"],
    ]);
  });
});

describe("NORM_GRATIS_RULES", () => {
  it("reads the gifts at their gift price and the pieces allowed now", () => {
    const rules = NORM_GRATIS_RULES([
      {
        items: [{ sku: "G", price: 2.69 }, { sku: "H", price: 3 }, { price: 1 }],
        code: "GRATIS_STEP",
        name: "TEST_GRATIS_STEPPED",
        price_missing_to_next_gratis_tier: 362,
        next_gratis_tier_quantity: 3,
        max_available_quantity: 2,
        next_gratis_tier_price: 1000,
        all_tiers: { "300": 1, "600": 2, "1000": 3 },
        is_available: true,
        extension: {},
      },
    ]);
    expect(rules).toEqual([
      {
        code: "GRATIS_STEP",
        name: "TEST_GRATIS_STEPPED",
        items: [{ sku: "G", price: "2.69" }, { sku: "H", price: "3.00" }],
        max_quantity: 2,
        next_tier_quantity: 3,
      },
    ]);
  });

  it("has no next tier at the top one, and nothing for an answer that is not a list", () => {
    const [top] = NORM_GRATIS_RULES([{ code: "X", items: [], max_available_quantity: 3, next_gratis_tier_quantity: null }]);
    expect(top.next_tier_quantity).toBeNull();
    expect(NORM_GRATIS_RULES({ detail: "x" })).toEqual([]);
  });
});
