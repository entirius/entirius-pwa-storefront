// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { thumb_src } from "./search-product-row";

const size = (width: number) => ({ uri: `/m/${width}.jpg`, width, height: width });

describe("thumb_src", () => {
  it("takes the 320 px size of the first picture", () => {
    expect(thumb_src([[size(160), size(320), size(640)]])).toBe("/m/320.jpg");
  });

  it("falls back to the first size", () => {
    expect(thumb_src([[size(160), size(640)]])).toBe("/m/160.jpg");
  });

  it("gives nothing without a picture (the placeholder shows)", () => {
    expect(thumb_src([])).toBeNull();
  });
});
