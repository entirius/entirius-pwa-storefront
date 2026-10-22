// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import type { WishlistItem } from "./wishlist.store";
import { merge_wishlist } from "./wishlist-sync";

const item = (sku: string, name = sku): WishlistItem => ({
  sku,
  name,
  url_key: sku.toLowerCase(),
  price: null,
  description: "",
  media: [],
});

describe("merge_wishlist", () => {
  it("follows the account and reuses local snapshots", () => {
    const local = { A: item("A", "local A"), B: item("B") };
    const merged = merge_wishlist(local, ["C", "A"], { C: item("C") }, false);
    expect(Object.keys(merged)).toEqual(["C", "A"]);
    expect(merged.A.name).toBe("local A");
    // B was removed on another device.
    expect(merged.B).toBeUndefined();
  });

  it("keeps the device's items at sign-in", () => {
    const merged = merge_wishlist({ B: item("B") }, ["A"], { A: item("A") }, true);
    expect(Object.keys(merged)).toEqual(["A", "B"]);
  });

  it("drops an account SKU the catalogue no longer has", () => {
    expect(merge_wishlist({}, ["GONE"], {}, false)).toEqual({});
  });
});
