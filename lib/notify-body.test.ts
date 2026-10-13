// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { notify_body } from "./notify-body";

const product = {
  sku: "S-1",
  name: "Chair",
  attributes: [
    { feature_idx: "series", value: "Magnetar", is_visible: true },
    { feature_idx: "tag", value: "a", is_visible: true },
    { feature_idx: "tag", value: "b", is_visible: true },
    { feature_idx: "tag", value: "hidden", is_visible: false },
    { feature_idx: "color", value: null, is_visible: true },
  ],
};

describe("notify_body", () => {
  it("carries sku, name and category when no attribute is configured", () => {
    expect(notify_body(product, "Chairs", [])).toEqual({ product_sku: "S-1", product_name: "Chair", category: "Chairs" });
  });

  it("adds the configured attributes: joined values, nothing for a missing, hidden or empty one", () => {
    expect(notify_body(product, undefined, ["series", "tag", "color", "absent"])).toEqual({
      product_sku: "S-1",
      product_name: "Chair",
      category: undefined,
      series: "Magnetar",
      tag: "a / b",
      color: undefined,
      absent: undefined,
    });
  });

  it("copes with a product without attributes", () => {
    expect(notify_body({ sku: "S-2", name: "Table" }, "Tables", ["series"]).series).toBeUndefined();
  });
});
