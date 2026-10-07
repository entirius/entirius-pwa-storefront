// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { resolve_cms_href } from "./cms-button";

describe("resolve_cms_href", () => {
  it("maps the CMS internal link convention to storefront routes", () => {
    expect(resolve_cms_href("internal", "/p/zero-g-recliner")).toBe("/product/zero-g-recliner");
    expect(resolve_cms_href("internal", "/c/chairs")).toBe("/catalog/chairs");
    expect(resolve_cms_href("internal", "c/sofas")).toBe("/catalog/sofas");
    expect(resolve_cms_href("internal", "/c/")).toBe("/");
    expect(resolve_cms_href("internal", "/about-us")).toBe("/about-us");
  });

  it("builds explicit targets", () => {
    expect(resolve_cms_href("catalog", "chairs")).toBe("/catalog/chairs");
    expect(resolve_cms_href("product", "zero-g-recliner")).toBe("/product/zero-g-recliner");
    expect(resolve_cms_href("cms", "about-us")).toBe("/about-us");
    expect(resolve_cms_href("external", "https://example.com")).toBe("https://example.com");
  });
});
