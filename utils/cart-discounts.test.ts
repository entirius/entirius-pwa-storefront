// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { NORM_CART } from "@/utils/NORMALIZERS/cart.normalizer";
import { discounts_body, kept_discounts, with_gift } from "./cart-discounts";

const cart = NORM_CART({
  discounts: [
    { code: "SUMMER", status: "valid", is_automatic: false },
    { code: "GRATIS_STEP", status: "valid", is_automatic: false, gratis_sku: "G", gratis_quantity: 2 },
    { code: "AUTO", status: "valid", is_automatic: true },
    { code: "OLD", status: "invalid", is_automatic: false },
  ],
});

describe("kept_discounts", () => {
  it("sends back the valid manual codes, the gift with its SKU and quantity", () => {
    expect(kept_discounts(cart)).toEqual([
      { code: "SUMMER" },
      { code: "GRATIS_STEP", sku: "G", quantity: 2 },
    ]);
  });

  it("is empty without a cart", () => {
    expect(kept_discounts(null)).toEqual([]);
  });
});

describe("with_gift", () => {
  it("replaces the gift of the rule and keeps the other codes", () => {
    expect(with_gift(kept_discounts(cart), "GRATIS_STEP", "H", 1)).toEqual([
      { code: "SUMMER" },
      { code: "GRATIS_STEP", sku: "H", quantity: 1 },
    ]);
  });

  it("drops the gift at quantity 0", () => {
    expect(with_gift(kept_discounts(cart), "GRATIS_STEP", "G", 0)).toEqual([{ code: "SUMMER" }]);
  });
});

describe("discounts_body", () => {
  it("clears the manual codes when none is left", () => {
    expect(discounts_body([])).toEqual({ clear: true });
    expect(discounts_body([{ code: "A" }])).toEqual({ codes: [{ code: "A" }] });
  });
});
