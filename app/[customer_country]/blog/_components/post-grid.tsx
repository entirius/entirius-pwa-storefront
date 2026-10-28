// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { get_i18n } from "@/lib/i18n/i18n.server";
import type { BlogPostCard } from "@/utils/NORMALIZERS/blog-post.normalizer";
import { PostTile } from "./post-tile.client";

// A page of post tiles, or a line saying there are none.
export async function PostGrid({ cards, heading = "h2" }: { cards: BlogPostCard[]; heading?: "h2" | "h3" }) {
  if (!cards.length) {
    const { t } = await get_i18n();
    return <p className="py-12 text-center text-muted-foreground">{t("blog.empty")}</p>;
  }
  return (
    <ul data-blog-posts className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <li key={card.slug}>
          <PostTile card={card} heading={heading} />
        </li>
      ))}
    </ul>
  );
}
