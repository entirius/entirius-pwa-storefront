// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { ChevronDown } from "lucide-react";
import type { BlogPostModel } from "@entirius/storefront-sdk/blog";
import type { Translate } from "@entirius/storefront-sdk/i18n";

// The post's H2 headings (and its FAQ) as anchor links; open by default, it folds away. A post with one heading
// has nothing to navigate.
export function PostToc({ t, entries }: { t: Translate; entries: BlogPostModel["toc"] }) {
  if (entries.length < 2) return null;
  return (
    <nav aria-label={t("blog.toc")} className="surface">
      <details open className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <span className="font-brand text-lg text-heading">{t("blog.toc")}</span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            {t("blog.toc_count", { count: entries.length })}
            <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5">
          {entries.map((entry) => (
            <li key={entry.id}>
              <a href={`#${entry.id}`} className="link">
                {entry.text}
              </a>
            </li>
          ))}
        </ol>
      </details>
    </nav>
  );
}
