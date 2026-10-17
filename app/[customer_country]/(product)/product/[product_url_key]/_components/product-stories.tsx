// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { SanitizeHTML } from "@/components/ui/sanitize-html";
import type { Story } from "@/utils/NORMALIZERS/product.normalizer";

// Long-text attributes, one section each after the specification (see is_story in lib/rich-html.ts).
export function ProductStories({ stories }: { stories: Story[] }) {
  return stories.map((story) => (
    <section
      key={story.idx}
      data-product-story={story.idx}
      aria-labelledby={`story-${story.idx}`}
      className="surface-divided grid gap-6 md:grid-cols-[minmax(12rem,1fr)_3fr]"
    >
      <h2 id={`story-${story.idx}`} className="text-2xl md:text-3xl">
        {story.name}
      </h2>
      <SanitizeHTML html={story.html} new_tab_links className="text-muted-foreground" />
    </section>
  ));
}
