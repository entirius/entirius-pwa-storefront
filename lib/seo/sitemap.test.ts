// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { sitemap_url, unique_entries } from "./sitemap";

describe("sitemap_url", () => {
  it("uses the canonical form for products and categories", () => {
    expect(sitemap_url("https://shop.test", "default", "product", "a-b")).toBe("https://shop.test/default/product/a-b");
    expect(sitemap_url("https://shop.test", "default", "catalog", "chairs")).toBe(
      "https://shop.test/default/catalog/chairs",
    );
  });

  it("keeps CMS pages plain, home as the root", () => {
    expect(sitemap_url("https://shop.test", "default", "page", "about")).toBe("https://shop.test/about");
    expect(sitemap_url("https://shop.test", "default", "page", "home")).toBe("https://shop.test/");
  });
});

describe("unique_entries", () => {
  it("drops duplicates", () => {
    expect(unique_entries(["a", "b", "a"])).toEqual([{ url: "a" }, { url: "b" }]);
  });
});
