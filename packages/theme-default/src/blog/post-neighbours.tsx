// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { ArrowLeft, ArrowRight } from "lucide-react";
import type { BlogPostModel } from "@entirius/storefront-sdk/blog";
import { Link } from "@entirius/storefront-sdk/components/link";
import type { Translate } from "@entirius/storefront-sdk/i18n";

// The older and the newer post in the same language.
export function PostNeighbours({ t, prev, next }: { t: Translate; prev: BlogPostModel["prev"]; next: BlogPostModel["next"] }) {
  if (!prev && !next) return null;
  return (
    <nav aria-label={t("blog.post_navigation")} className="grid gap-4 sm:grid-cols-2">
      {prev && (
        <Link href={prev.href} rel="prev" className="surface-outline flex flex-col gap-1 transition-colors hover:bg-muted">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowLeft aria-hidden className="size-3.5" />
            {t("blog.previous_post")}
          </span>
          <span className="text-heading">{prev.title}</span>
        </Link>
      )}
      {next && (
        <Link
          href={next.href}
          rel="next"
          className="surface-outline flex flex-col items-end gap-1 text-right transition-colors hover:bg-muted sm:col-start-2"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {t("blog.next_post")}
            <ArrowRight aria-hidden className="size-3.5" />
          </span>
          <span className="text-heading">{next.title}</span>
        </Link>
      )}
    </nav>
  );
}
