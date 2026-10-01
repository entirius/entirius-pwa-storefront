// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { NORM_PRICE_DATA, PRICE_ON_REQUEST } from "./price.normalizer";

describe("NORM_PRICE_DATA", () => {
  it("shows a regular price", () => {
    expect(NORM_PRICE_DATA({ gross: "549.00", currency: "EUR" })).toEqual(["549.00 EUR"]);
  });

  it("pairs the list price with the special price", () => {
    expect(
      NORM_PRICE_DATA({ gross: "829.00", final_gross: "689.00", has_special_price: true, currency: "EUR" }),
    ).toEqual(["829.00 EUR", "689.00 EUR"]);
  });

  it("ignores a special flag without a final price", () => {
    expect(NORM_PRICE_DATA({ gross: "10.00", has_special_price: true, currency: "EUR" })).toEqual(["10.00 EUR"]);
  });

  it("shows the lowest price of a range (CONFIGURABLE)", () => {
    expect(NORM_PRICE_DATA({ is_range: true, gross: null, range_from_gross: "549.00", currency: "EUR" })).toEqual([
      "From 549.00 EUR",
    ]);
    expect(
      NORM_PRICE_DATA({ is_range: true, range_from_gross: "549.00", range_from_special_gross: "499.00", currency: "EUR" }),
    ).toEqual(["From 549.00 EUR", "From 499.00 EUR"]);
  });

  it("says price on request when there is no price (CUSTOM) or no amount", () => {
    expect(NORM_PRICE_DATA(null)).toEqual([PRICE_ON_REQUEST]);
    expect(NORM_PRICE_DATA({ gross: null, currency: "EUR" })).toEqual([PRICE_ON_REQUEST]);
    expect(NORM_PRICE_DATA({ is_range: true, range_from_gross: null, currency: "EUR" })).toEqual([PRICE_ON_REQUEST]);
  });
});
