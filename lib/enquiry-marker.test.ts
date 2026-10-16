// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { split_enquiry_marker } from "./enquiry-marker";

describe("split_enquiry_marker", () => {
  it("returns null without a marker", () => {
    expect(split_enquiry_marker("<p>Write to us</p>")).toBeNull();
  });

  it("splits the text around the marker and applies the defaults", () => {
    expect(split_enquiry_marker('<p>Before</p><div data-enquiry-form></div><p>After</p>')).toEqual({
      before: "<p>Before</p>",
      after: "<p>After</p>",
      slug: "contact",
      form_type: "general",
    });
  });

  it("reads slug and type from the marker", () => {
    const parts = split_enquiry_marker('<div data-enquiry-form data-slug="dealers" data-type="b2b-offer">\n</div>');
    expect(parts).toMatchObject({ before: "", after: "", slug: "dealers", form_type: "b2b-offer" });
  });
});
