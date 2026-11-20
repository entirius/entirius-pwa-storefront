// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Fragment } from "react";
import type { BlogPostModel } from "@entirius/storefront-sdk/blog";
import { Link } from "@entirius/storefront-sdk/components/link";
import type { Translate } from "@entirius/storefront-sdk/i18n";

// The post's category, heading, byline (each author linked to their page) and dates.
export function PostHeader({ t, post, className }: { t: Translate; post: BlogPostModel; className?: string }) {
  return (
    <header className={className}>
      {post.category && (
        <Link href={post.category.href} className="w-fit text-sm font-medium text-primary hover:underline">
          {post.category.name}
        </Link>
      )}
      <h1 className="text-4xl leading-tight md:text-5xl">{post.title}</h1>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {post.byline.length > 0 && (
          <span>
            {post.byline.map((part, i) =>
              part.href ? (
                <Link key={i} href={part.href} className="hover:text-foreground hover:underline">
                  {part.text}
                </Link>
              ) : (
                <Fragment key={i}>{part.text}</Fragment>
              ),
            )}
          </span>
        )}
        {post.published && (
          <time dateTime={post.published.iso}>{t("blog.published", { date: post.published.label })}</time>
        )}
        {post.updated && <time dateTime={post.updated.iso}>{t("blog.updated", { date: post.updated.label })}</time>}
      </p>
    </header>
  );
}
