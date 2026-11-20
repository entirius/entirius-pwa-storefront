// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { BlogPostPageProps } from "@entirius/storefront-sdk/blog";
import { cn } from "@theme/lib/utils";
import { CmsImage } from "@theme/cms/picture";
import { PostHeader } from "@theme/blog/post-header";
import { PostToc } from "@theme/blog/post-toc";
import { PostAuthors } from "@theme/blog/post-authors";
import { PostNeighbours } from "@theme/blog/post-neighbours";

// The reading column (~900 px); the cover takes the page width.
const COLUMN = "mx-auto w-full max-w-4xl";

// A post: header, cover, table of contents, the body (its CMS blocks), "About the author", the older and newer post.
// `data-article` gives the CMS text the body colour and reading spacing; `lang` names the post's language when it
// differs from the page's.
export function PostPage({ t, post, body }: BlogPostPageProps) {
  return (
    <article data-article lang={post.language || undefined} className="flex w-full flex-col gap-8 pb-8">
      <PostHeader t={t} post={post} className={cn(COLUMN, "flex flex-col gap-4")} />
      {post.cover && <CmsImage picture={post.cover} ratio={16 / 9} sizes="100vw" className="rounded-3xl" />}
      <div className={cn(COLUMN, "flex flex-col gap-8")}>
        <PostToc t={t} entries={post.toc} />
        <div className="flex flex-col">{body}</div>
        <PostAuthors t={t} authors={post.authors} />
        <PostNeighbours t={t} prev={post.prev} next={post.next} />
      </div>
    </article>
  );
}
