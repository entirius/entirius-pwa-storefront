// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { NORM_PRODUCTS_DATA, type SpecGroup } from "./product.normalizer";

const attr = (feature_idx: string, feature_name: string, value: string, extra: object = {}) => ({
  feature_idx,
  feature_name,
  value,
  is_visible: true,
  group_idx: null,
  group_name: null,
  group_position: null,
  ...extra,
});

const one = (product: object) => NORM_PRODUCTS_DATA([{ sku: "S", media: [], ...product }])[0];

describe("NORM_PRODUCTS_DATA specs", () => {
  it("keeps visible attributes and joins a multi-select into one row", () => {
    const p = one({
      attributes: [
        attr("series", "Series", "Heliox Works"),
        attr("options", "Options", "Ceramic Composite"),
        attr("options", "Options", "Nano-Chrome"),
        attr("internal", "Internal", "x", { is_visible: false }),
        attr("empty", "Empty", ""),
      ],
    });
    expect(p.specs).toEqual([
      {
        name: null,
        rows: [
          { name: "Series", value: "Heliox Works" },
          { name: "Options", value: "Ceramic Composite, Nano-Chrome" },
        ],
      },
    ]);
  });

  it("orders groups by group_position, ungrouped last", () => {
    const p = one({
      attributes: [
        attr("a", "A", "1"),
        attr("w", "Width", "30", { group_idx: "dim", group_name: "Dimensions", group_position: 2 }),
        attr("m", "Material", "Steel", { group_idx: "mat", group_name: "Material", group_position: 1 }),
      ],
    });
    expect(p.specs.map((g: SpecGroup) => g.name)).toEqual(["Material", "Dimensions", null]);
  });

  it("has no specs without attributes", () => {
    expect(one({}).specs).toEqual([]);
  });
});

describe("NORM_PRODUCTS_DATA pricing fields", () => {
  it("keeps percent_off only for a special price", () => {
    expect(one({ price: { gross: "829.00", final_gross: "689.00", has_special_price: true, percent_off: "17", currency: "EUR" } }).percent_off).toBe("17");
    expect(one({ price: { gross: "549.00", has_special_price: false, percent_off: "0", currency: "EUR" } }).percent_off).toBeNull();
  });

  it("is purchasable only with a fixed list price", () => {
    expect(one({ price: { gross: "549.00", currency: "EUR" } }).purchasable).toBe(true);
    expect(one({ price: { is_range: true, range_from_gross: "549.00", currency: "EUR" } }).purchasable).toBe(false);
    expect(one({ price: null }).purchasable).toBe(false);
  });
});
