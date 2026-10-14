// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { with_stock_first } from "./stock-sort";

describe("with_stock_first", () => {
  it("puts s_on_stock before the chosen sort", () => {
    const result = with_stock_first({ category: "a", s_price: "asc" }, true);
    expect(Object.keys(result)).toEqual(["s_on_stock", "category", "s_price"]);
    expect(result).toMatchObject({ s_on_stock: "desc" });
  });

  it("leaves a list without a chosen sort alone", () => {
    const params = { category: "a", q_series: "x" };
    expect(with_stock_first(params, true)).toBe(params);
  });

  it("leaves an explicit s_on_stock alone", () => {
    const params = { s_price: "asc", s_on_stock: "asc" };
    expect(with_stock_first(params, true)).toBe(params);
  });

  it("is off by default: the API order stays", () => {
    const params = { s_price: "asc" };
    expect(with_stock_first(params)).toBe(params);
  });
});
