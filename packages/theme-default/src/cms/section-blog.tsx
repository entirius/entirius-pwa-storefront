// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsSectionBlogProps } from "@entirius/storefront-sdk/cms";
import { SectionShell } from "@theme/cms/section-shell";
import { PostTile } from "@theme/blog/post-tile";

// The posts the editor picked (up to three), e.g. "From the blog" on the home page, in the blog's own tiles.
export function SectionBlog({ t, title, description, links, width, posts }: CmsSectionBlogProps) {
  if (!posts.length) return null;
  return (
    <SectionShell t={t} title={title} description={description} links={links} width={width}>
      {/* The blog's grid: a tile keeps its size however many the editor picked. */}
      <ul data-blog-posts className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.href}>
            <PostTile post={post} heading={title ? "h3" : "h2"} />
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
