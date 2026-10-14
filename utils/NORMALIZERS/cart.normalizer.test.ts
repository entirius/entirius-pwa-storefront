// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { NORM_CART } from "./cart.normalizer";

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
