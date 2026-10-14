// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { accept_candidates, rule_filter, type RawProduct } from "./related";

const product: RawProduct = {
  sku: "A",
  categories: [
    { name: "Chairs", url_key: "chairs", path: [{ name: "Chairs", url_key: "chairs" }] },
    {
      name: "Office",
      url_key: "office",
      path: [
        { name: "Chairs", url_key: "chairs" },
        { name: "Office", url_key: "office" },
      ],
    },
  ],
  attributes: [{ feature_idx: "series", value_idx: "heliox" }],
};

describe("rule_filter", () => {
  it("builds the query of the most specific category", () => {
    expect(rule_filter("category", product)?.query).toEqual({ category: "office" });
  });

  it("joins terms and requires all of them", () => {
    const filter = rule_filter("series+category", product)!;
    expect(filter.query).toEqual({ q_series: "heliox", category: "office" });
    const match = { sku: "B", categories: [{ name: "Office", url_key: "office" }], attributes: [{ feature_idx: "series", value_idx: "heliox" }] };
    expect(filter.matches(match)).toBe(true);
    expect(filter.matches({ ...match, attributes: [] })).toBe(false);
  });

  it("is skipped when the product lacks a term", () => {
    expect(rule_filter("maker", product)).toBeNull();
    expect(rule_filter("series+maker", product)).toBeNull();
  });
});

describe("accept_candidates", () => {
  const filter = rule_filter("category", product)!;
  const inside = (sku: string, on_stock = true): RawProduct => ({ sku, on_stock, categories: [{ name: "Office", url_key: "office" }] });

  it("drops the product itself, sold-out items, duplicates and non-matches", () => {
    const seen = new Set(["A"]);
    const list = [inside("A"), inside("B", false), inside("C"), inside("C"), { sku: "D", categories: [] }];
    expect(accept_candidates(list, seen, filter, 8).map((p) => p.sku)).toEqual(["C"]);
  });

  it("stops at the room left", () => {
    expect(accept_candidates([inside("B"), inside("C"), inside("D")], new Set(), filter, 2)).toHaveLength(2);
  });
});
