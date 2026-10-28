// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { ImageIcon } from "lucide-react";
import { LinkDynamic } from "@/lib/link-dynamic";
import { blog_post_path } from "@/lib/blog-paths";
import { useI18n } from "@/providers/i18n.provider";
import CmsImage from "@/app/[customer_country]/(builder)/[[...slug]]/_components/cms-image";
import { format_blog_date, type BlogPostCard } from "@/utils/NORMALIZERS/blog-post.normalizer";

// A post on a list (the blog, an author's page, a CMS `section-blog`): cover, title, summary, authors and date, the
// whole card one link. A client component: CMS pages render their sections in the browser.
export function PostTile({ card, heading: Heading = "h2" }: { card: BlogPostCard; heading?: "h2" | "h3" }) {
  const { language } = useI18n();
  const authors = new Intl.ListFormat(language, { type: "conjunction" }).format(card.authors);
  return (
    <LinkDynamic
      href={blog_post_path(card.slug)}
      lang={card.language || undefined}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-card bg-gradient-card transition-shadow hover:shadow-md"
    >
      {card.cover ? (
        <CmsImage images_set={card.cover} aspect_ratio={16 / 9} sizes="(max-width: 768px) 100vw, 33vw" />
      ) : (
        <div aria-hidden className="flex aspect-video items-center justify-center bg-muted text-muted-foreground">
          <ImageIcon className="size-8" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-6">
        <Heading className="text-xl group-hover:underline">{card.title}</Heading>
        {card.excerpt && <p className="line-clamp-3 text-sm text-muted-foreground">{card.excerpt}</p>}
        {(authors || card.published_at) && (
          <p className="mt-auto flex flex-wrap gap-x-3 pt-2 text-xs text-muted-foreground">
            {authors && <span>{authors}</span>}
            {card.published_at && (
              <time dateTime={card.published_at}>{format_blog_date(card.published_at, language)}</time>
            )}
          </p>
        )}
      </div>
    </LinkDynamic>
  );
}
