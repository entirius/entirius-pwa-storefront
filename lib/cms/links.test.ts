// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { cms_links, resolve_cms_href } from "./links";

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

describe("cms_links", () => {
  const keys = new Map([["catalog:krzesla", "chairs"]]);

  it("resolves the editor's buttons to shop paths in the active language's url keys", () => {
    expect(
      cms_links(
        [
          { url: "/c/krzesla", label: "All chairs", type: "internal" },
          { url: "about-us", label: "About", type: "cms", dye: "outline" },
          { url: "https://example.com", label: "Partner", type: "external" },
          { url: "#cookies", label: "Cookies", type: "external", dye: "unknown" },
        ],
        keys,
      ),
    ).toEqual([
      { label: "All chairs", href: "/catalog/chairs", external: false, new_tab: false, look: null },
      { label: "About", href: "/about-us", external: false, new_tab: false, look: "outline" },
      { label: "Partner", href: "https://example.com", external: true, new_tab: true, look: null },
      { label: "Cookies", href: "#cookies", external: true, new_tab: false, look: null },
    ]);
  });

  it("leaves out a button without a label or an address, and reads anything that is not a list as none", () => {
    expect(cms_links([{ url: "/c/sofas" }, { label: "Empty" }, null], keys)).toEqual([]);
    expect(cms_links(undefined, keys)).toEqual([]);
    expect(cms_links("nope", keys)).toEqual([]);
  });

  it("reads a button without a type as the editor's internal link", () => {
    expect(cms_links([{ url: "/p/zero-g-recliner", label: "Buy" }], keys)[0].href).toBe("/product/zero-g-recliner");
  });
});
