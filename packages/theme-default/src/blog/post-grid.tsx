// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { BlogPostCardModel } from "@entirius/storefront-sdk/blog";
import type { Translate } from "@entirius/storefront-sdk/i18n";
import { PostTile } from "@theme/blog/post-tile";

// A page of post tiles, or a line saying there are none.
export function PostGrid({ t, posts, heading = "h2" }: { t: Translate; posts: BlogPostCardModel[]; heading?: "h2" | "h3" }) {
  if (!posts.length) return <p className="py-12 text-center text-muted-foreground">{t("blog.empty")}</p>;
  return (
    <ul data-blog-posts className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.href}>
          <PostTile post={post} heading={heading} />
        </li>
      ))}
    </ul>
  );
}
