// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { key_facts_line } from "./key-facts";

const attr = (feature_idx: string, feature_name: string, feature_type: string, value: string | null, is_visible = true) => ({
  feature_idx,
  feature_name,
  feature_type,
  value,
  is_visible,
});

const attributes = [
  attr("height", "Height (cm)", "DECIMAL", "42.5"),
  attr("series", "Series", "SELECT", "Heliox Works"),
  attr("material", "Material", "MULTISELECT", "Oak"),
  attr("material", "Material", "MULTISELECT", "Steel"),
  attr("hidden", "Hidden", "TEXT", "x", false),
];

describe("key_facts_line", () => {
  it("prints nothing without configuration", () => {
    expect(key_facts_line(attributes, [], "en")).toBe("");
  });

  it("prints a number with its label and unit, other values alone", () => {
    expect(key_facts_line(attributes, [{ idx: "height" }, { idx: "series" }], "en")).toBe("Height 42.5 cm · Heliox Works");
  });

  it("uses the configured label and joins repeated values", () => {
    expect(key_facts_line(attributes, [{ idx: "height", label: "H" }, { idx: "material" }], "en")).toBe("H 42.5 cm · Oak / Steel");
  });

  it("skips hidden and missing attributes", () => {
    expect(key_facts_line(attributes, [{ idx: "hidden" }, { idx: "nope" }], "en")).toBe("");
    expect(key_facts_line(undefined, [{ idx: "height" }], "en")).toBe("");
  });
});
