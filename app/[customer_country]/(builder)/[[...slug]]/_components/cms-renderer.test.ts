// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import type { CmsSectionData } from "@/types/cms.types";
import { cms_blocks, render_cms_component } from "./cms-renderer";
import { blog_posts_key, type CmsData } from "./cms-data";

const cms: CmsData = {
  t: (key) => key,
  language: "en",
  keys: new Map(),
  by_url_key: new Map(),
  by_sku: new Map(),
  by_category: new Map(),
  posts: new Map(),
};

const wrapper_props = (data: CmsSectionData) =>
  (render_cms_component(data, 0, cms) as ReactElement<Record<string, unknown>>).props;

describe("section variant", () => {
  it("leaves the attribute out without a variant", () => {
    const props = wrapper_props({ core_type: "section-text" });
    expect(props["data-cms-type"]).toBe("section-text");
    expect(props["data-cms-variant"]).toBeUndefined();
  });

  it("names the variant on the wrapper", () => {
    const props = wrapper_props({ core_type: "section-text", variant: 2 });
    expect(props["data-cms-variant"]).toBe(2);
  });
});

describe("blocks with data read on the server", () => {
  const block = (data: CmsSectionData, data_cms: Partial<CmsData> = {}) =>
    cms_blocks[data.core_type]({ data, cms: { ...cms, ...data_cms }, tiles: [], width: "container" }) as ReactElement<
      Record<string, unknown>
    > | null;

  it("hands a blog section the posts read for its routes", () => {
    const post = {
      href: "/blog/first",
      language: "en",
      title: "First",
      excerpt: "",
      cover: null,
      authors: "",
      published: null,
    };
    const element = block(
      { core_type: "section-blog", title: "From the blog", blog_section: [{ label: "first" }, { label: "/blog/second/" }] },
      { posts: new Map([[blog_posts_key(["first", "second"]), [post]]]) },
    );
    expect(element?.props.posts).toEqual([post]);
    expect(element?.props.title).toBe("From the blog");
  });

  it("leaves out a product tile the channel does not sell and a category section without products", () => {
    expect(block({ core_type: "tile-product", sku: "NOT-SOLD" })).toBeNull();
    expect(block({ core_type: "section-product-slider-category", custom_field: "empty" })).toBeNull();
  });

  it("resolves a section's buttons with the active language's url keys", () => {
    const element = block(
      { core_type: "section-accordion", custom_buttons: [{ url: "/c/krzesla", label: "All chairs", type: "internal" }] },
      { keys: new Map([["catalog:krzesla", "chairs"]]) },
    );
    expect(element?.props.links).toEqual([
      { label: "All chairs", href: "/catalog/chairs", external: false, new_tab: false, look: null },
    ]);
  });
});
