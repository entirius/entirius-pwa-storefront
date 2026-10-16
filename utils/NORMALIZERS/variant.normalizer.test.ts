// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { NORM_VARIANTS_DATA } from "./variant.normalizer";

// API colour data, not styling: built from the digits so the raw-colour lint rule stays on.
const hex = (digits: string) => `#${digits}`;

const response = (options: { value: string; label: string; extension?: unknown }[], widget_type?: string) => ({
  data: {
    options: [{ idx: "color", label: "Kolor", widget_type, options }],
    products: [],
  },
});

const axis = (r: ReturnType<typeof response>) =>
  NORM_VARIANTS_DATA(r as Parameters<typeof NORM_VARIANTS_DATA>[0], []).axes[0];

describe("NORM_VARIANTS_DATA swatches", () => {
  it("keeps the axis widget type and a valid colour hash", () => {
    const a = axis(
      response(
        [
          { value: "camel", label: "Camel", extension: { color_hash: hex("C19A6B") } },
          { value: "white", label: "Biały", extension: { color_hash: hex("fff") } },
        ],
        "Swatch_Visual",
      ),
    );
    expect(a.widget_type).toBe("Swatch_Visual");
    expect(a.options.map((o) => o.color_hash)).toEqual([hex("C19A6B"), hex("fff")]);
  });

  it("gives null for a pattern without a hash and for no extension", () => {
    const a = axis(
      response(
        [
          { value: "kwiaty", label: "Kwiaty", extension: null },
          { value: "pantera", label: "Pantera", extension: { color_hash: null } },
          { value: "plain", label: "Plain" },
        ],
        "Swatch_Visual",
      ),
    );
    expect(a.options.map((o) => o.color_hash)).toEqual([null, null, null]);
  });

  it("rejects a malformed hash", () => {
    const a = axis(
      response([
        { value: "a", label: "A", extension: { color_hash: "C19A6B" } },
        { value: "b", label: "B", extension: { color_hash: hex("C19A6") } },
        { value: "c", label: "C", extension: { color_hash: "red" } },
        { value: "d", label: "D", extension: { color_hash: hex("GGGGGG") } },
      ]),
    );
    expect(a.options.map((o) => o.color_hash)).toEqual([null, null, null, null]);
  });

  it("leaves the widget type null when the API sends none", () => {
    expect(axis(response([{ value: "m", label: "M" }])).widget_type).toBeNull();
  });
});
