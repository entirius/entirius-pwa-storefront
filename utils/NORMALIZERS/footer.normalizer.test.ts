// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { NORM_FOOTER, resolve_footer_href } from "./footer.normalizer";

describe("NORM_FOOTER", () => {
  it("turns link columns into footer columns, in sort order", () => {
    const columns = NORM_FOOTER({
      data: [
        {
          content: {
            items: [
              {
                label: "Company",
                display_as: "megamenu",
                sort_order: 1,
                columns: [
                  {
                    type: "links",
                    heading: "Company",
                    links: [
                      { label: "Blog", link_type: "page", link_value: "blog", sort_order: 1 },
                      { label: "About us", link_type: "page", link_value: "about", sort_order: 0 },
                    ],
                  },
                ],
              },
              {
                label: "Shop",
                display_as: "megamenu",
                sort_order: 0,
                columns: [
                  {
                    type: "links",
                    heading: "Shop",
                    links: [{ label: "Chairs", link_type: "category", link_value: "chairs" }],
                  },
                  { type: "banner", heading: "Ignored" },
                ],
              },
            ],
          },
        },
      ],
    });
    expect(columns).toEqual([
      { heading: "Shop", links: [{ label: "Chairs", href: "/catalog/chairs", external: false }] },
      {
        heading: "Company",
        links: [
          { label: "About us", href: "/about", external: false },
          { label: "Blog", href: "/blog", external: false },
        ],
      },
    ]);
  });

  it("puts a plain link item in its own column and skips empty ones", () => {
    expect(
      NORM_FOOTER({
        data: [
          {
            content: {
              items: [
                { label: "Stores", display_as: "link", link_type: "url", link_value: "https://example.com/stores" },
                { label: "Empty", display_as: "megamenu", columns: [{ type: "links", links: [] }] },
              ],
            },
          },
        ],
      }),
    ).toEqual([
      { heading: "", links: [{ label: "Stores", href: "https://example.com/stores", external: true }] },
    ]);
  });

  it("survives an unpublished footer", () => {
    expect(NORM_FOOTER({ data: [] })).toEqual([]);
    expect(NORM_FOOTER(undefined)).toEqual([]);
  });

  it("maps CMS link types to storefront paths", () => {
    expect(resolve_footer_href("page", "home")).toBe("/");
    expect(resolve_footer_href("product", "zero-g-recliner")).toBe("/product/zero-g-recliner");
    expect(resolve_footer_href("url", "")).toBe("/");
  });
});
