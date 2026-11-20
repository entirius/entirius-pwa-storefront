// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { ImageIcon } from "lucide-react";
import type { BlogPostCardModel } from "@entirius/storefront-sdk/blog";
import { Link } from "@entirius/storefront-sdk/components/link";
import { CmsImage } from "@theme/cms/picture";

// A post on a list (the blog, an author's page, a CMS `section-blog`): cover, title, summary, authors and date, the
// whole card one link.
export function PostTile({ post, heading: Heading = "h2" }: { post: BlogPostCardModel; heading?: "h2" | "h3" }) {
  return (
    <Link
      href={post.href}
      lang={post.language || undefined}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-card bg-gradient-card transition-shadow hover:shadow-md"
    >
      {post.cover ? (
        <CmsImage picture={post.cover} ratio={16 / 9} sizes="(max-width: 768px) 100vw, 33vw" />
      ) : (
        <div aria-hidden className="flex aspect-video items-center justify-center bg-muted text-muted-foreground">
          <ImageIcon className="size-8" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-6">
        <Heading className="text-xl group-hover:underline">{post.title}</Heading>
        {post.excerpt && <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>}
        {(post.authors || post.published) && (
          <p className="mt-auto flex flex-wrap gap-x-3 pt-2 text-xs text-muted-foreground">
            {post.authors && <span>{post.authors}</span>}
            {post.published && <time dateTime={post.published.iso}>{post.published.label}</time>}
          </p>
        )}
      </div>
    </Link>
  );
}
