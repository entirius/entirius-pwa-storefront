// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { ArrowLeft, ArrowRight } from "lucide-react";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { LinkDynamic } from "@/lib/link-dynamic";
import { blog_post_path } from "@/lib/blog-paths";
import type { BlogPostLink } from "@/utils/NORMALIZERS/blog-post.normalizer";

// The older and the newer post in the same language.
export async function PostNeighbours({ prev, next }: { prev: BlogPostLink | null; next: BlogPostLink | null }) {
  if (!prev && !next) return null;
  const { t } = await get_i18n();
  return (
    <nav aria-label={t("blog.post_navigation")} className="grid gap-4 sm:grid-cols-2">
      {prev && (
        <LinkDynamic
          href={blog_post_path(prev.slug)}
          rel="prev"
          className="surface-outline flex flex-col gap-1 transition-colors hover:bg-muted"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowLeft aria-hidden className="size-3.5" />
            {t("blog.previous_post")}
          </span>
          <span className="text-heading">{prev.title}</span>
        </LinkDynamic>
      )}
      {next && (
        <LinkDynamic
          href={blog_post_path(next.slug)}
          rel="next"
          className="surface-outline flex flex-col items-end gap-1 text-right transition-colors hover:bg-muted sm:col-start-2"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {t("blog.next_post")}
            <ArrowRight aria-hidden className="size-3.5" />
          </span>
          <span className="text-heading">{next.title}</span>
        </LinkDynamic>
      )}
    </nav>
  );
}
