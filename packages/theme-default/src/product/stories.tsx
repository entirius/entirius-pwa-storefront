// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { RichText } from "@entirius/storefront-sdk/components/rich-text";
import { useProductPage } from "@entirius/storefront-sdk/product/page";

// Long-text attributes (the core picks them), one section each after the specification.
export function ProductStories() {
  const { product } = useProductPage();
  return product.stories.map((story) => (
    <section
      key={story.idx}
      data-product-story={story.idx}
      aria-labelledby={`story-${story.idx}`}
      className="surface-divided grid gap-6 md:grid-cols-[minmax(12rem,1fr)_3fr]"
    >
      <h2 id={`story-${story.idx}`} className="text-2xl md:text-3xl">
        {story.name}
      </h2>
      <RichText html={story.html} new_tab_links className="text-muted-foreground" />
    </section>
  ));
}
