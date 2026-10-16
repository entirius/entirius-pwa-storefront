// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { hero_desktop_sizes, is_full_width } from "./cms-width";

describe("section width", () => {
  it("is full width only for `full_width`", () => {
    expect(is_full_width("full_width")).toBe(true);
    expect(is_full_width("container")).toBe(false);
    expect(is_full_width(undefined)).toBe(false);
    expect(is_full_width("something-else")).toBe(false);
  });

  it("sizes the desktop hero image by the width", () => {
    expect(hero_desktop_sizes("full_width")).toBe("100vw");
    expect(hero_desktop_sizes("container")).toBe("50vw");
    expect(hero_desktop_sizes()).toBe("50vw");
  });
});
