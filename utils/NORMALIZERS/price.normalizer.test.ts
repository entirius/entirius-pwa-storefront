// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { NORM_PRICE_DATA, stored_price } from "./price.normalizer";

describe("NORM_PRICE_DATA", () => {
  it("keeps a regular price as a raw amount", () => {
    expect(NORM_PRICE_DATA({ gross: "549.00", currency: "EUR" })).toEqual({ gross: "549.00", currency: "EUR" });
  });

  it("pairs the list price with the special price", () => {
    expect(
      NORM_PRICE_DATA({ gross: "829.00", final_gross: "689.00", has_special_price: true, currency: "EUR" }),
    ).toEqual({ gross: "829.00", final_gross: "689.00", currency: "EUR" });
  });

  it("ignores a special flag without a final price", () => {
    expect(NORM_PRICE_DATA({ gross: "10.00", has_special_price: true, currency: "EUR" })).toEqual({
      gross: "10.00",
      currency: "EUR",
    });
  });

  it("marks the lowest price of a range (CONFIGURABLE)", () => {
    expect(NORM_PRICE_DATA({ is_range: true, gross: null, range_from_gross: "549.00", currency: "EUR" })).toEqual({
      gross: "549.00",
      currency: "EUR",
      from: true,
    });
    expect(
      NORM_PRICE_DATA({ is_range: true, range_from_gross: "549.00", range_from_special_gross: "499.00", currency: "EUR" }),
    ).toEqual({ gross: "549.00", final_gross: "499.00", currency: "EUR", from: true });
  });

  it("has no price when there is none (CUSTOM) or no amount", () => {
    expect(NORM_PRICE_DATA(null)).toBeNull();
    expect(NORM_PRICE_DATA({ gross: null, currency: "EUR" })).toBeNull();
    expect(NORM_PRICE_DATA({ is_range: true, range_from_gross: null, currency: "EUR" })).toBeNull();
  });
});

describe("stored_price", () => {
  it("keeps a raw-amount price and drops a legacy display array", () => {
    expect(stored_price({ gross: "549.00", currency: "EUR" })).toEqual({ gross: "549.00", currency: "EUR" });
    expect(stored_price(["549.00 EUR"])).toBeNull();
    expect(stored_price(undefined)).toBeNull();
  });
});
