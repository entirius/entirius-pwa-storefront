// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { NORM_CATEGORIES_DATA, NORM_CATEGORY_BRANCH } from "./category.normalizer";

const subtree = [
  {
    idx: "a",
    url_key: "living-room-sofas",
    name: "Living Room Sofas",
    has_children: true,
    children: [{ idx: "b", url_key: "corner-sofas", name: "Corner Sofas", has_children: false, children: [] }],
  },
];

describe("NORM_CATEGORIES_DATA", () => {
  it("drops the nested rows by default", () => {
    expect(NORM_CATEGORIES_DATA(subtree)).toEqual([
      { id: "a", url_key: "living-room-sofas", name: "Living Room Sofas", has_children: true },
    ]);
  });

  it("keeps the whole subtree when asked, without empty children", () => {
    expect(NORM_CATEGORIES_DATA(subtree, true)).toEqual([
      {
        id: "a",
        url_key: "living-room-sofas",
        name: "Living Room Sofas",
        has_children: true,
        children: [{ id: "b", url_key: "corner-sofas", name: "Corner Sofas", has_children: false }],
      },
    ]);
  });

  it("answers an empty list for anything but rows", () => {
    expect(NORM_CATEGORIES_DATA(undefined)).toEqual([]);
  });
});

describe("NORM_CATEGORY_BRANCH", () => {
  const parent = { url_key: "sofas", name: "Sofas", has_children: true };
  const self = { url_key: "sofas", name: "Sofas", has_children: false, is_self: true };

  it("puts the parent first, as a leaf", () => {
    const child = { url_key: "sofa-beds", name: "Sofa Beds", has_children: false };
    expect(NORM_CATEGORY_BRANCH(parent, [child])).toEqual([self, child]);
  });

  it("gives the parent's row before the children have loaded", () => {
    expect(NORM_CATEGORY_BRANCH(parent)).toEqual([self]);
  });
});
