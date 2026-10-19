// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { description_html, has_text, is_story } from "./rich-html";

describe("description_html", () => {
  it("turns blank lines into paragraphs and single breaks into <br>", () => {
    expect(description_html("One\nline\n\nTwo & more")).toBe("<p>One<br>line</p><p>Two &amp; more</p>");
  });

  it("leaves HTML alone", () => {
    expect(description_html("<p>Hi</p>")).toBe("<p>Hi</p>");
  });
});

describe("has_text", () => {
  it("is false for nothing and for empty markup, true for any visible text", () => {
    for (const empty of [null, undefined, "", "  ", "<p></p>", "<p>&nbsp;</p><br>"]) expect(has_text(empty)).toBe(false);
    expect(has_text("<p>Wool</p>")).toBe(true);
    expect(has_text("Wool")).toBe(true);
  });
});

describe("is_story", () => {
  const text = (value: string, feature_idx = "notes", feature_type = "TEXT") => ({ feature_idx, feature_type, value, is_visible: true });

  it("accepts a TEXT attribute whose value is HTML", () => {
    expect(is_story(text("<p>Long</p>"), [])).toBe(true);
  });

  it("keeps plain text in the specification", () => {
    expect(is_story(text("38"), [])).toBe(false);
    expect(is_story(text("<p>Long</p>", "notes", "SELECT"), [])).toBe(false);
  });

  it("accepts the listed idxs, whatever the value", () => {
    expect(is_story(text("Plain long text", "history"), ["history"])).toBe(true);
  });

  it("ignores hidden and empty values", () => {
    expect(is_story({ ...text("<p>x</p>"), is_visible: false }, [])).toBe(false);
    expect(is_story(text(""), ["notes"])).toBe(false);
  });
});
