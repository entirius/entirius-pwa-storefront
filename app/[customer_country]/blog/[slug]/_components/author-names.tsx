// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Fragment } from "react";
import { LinkDynamic } from "@/lib/link-dynamic";
import { blog_author_path } from "@/lib/blog-paths";
import type { BlogAuthor } from "@/utils/NORMALIZERS/blog-post.normalizer";

// "Anna, Jan and Ewa" with each name linked to the author's page (a free-text name of an older post has none).
export function AuthorNames({ authors, language }: { authors: BlogAuthor[]; language: string }) {
  if (!authors.length) return null;
  const parts = new Intl.ListFormat(language, { type: "conjunction" }).formatToParts(authors.map((a) => a.name));
  let next = 0;
  return (
    <span>
      {parts.map((part, i) => {
        if (part.type !== "element") return <Fragment key={i}>{part.value}</Fragment>;
        const author = authors[next++];
        return author.slug ? (
          <LinkDynamic key={i} href={blog_author_path(author.slug)} className="hover:text-foreground hover:underline">
            {part.value}
          </LinkDynamic>
        ) : (
          <Fragment key={i}>{part.value}</Fragment>
        );
      })}
    </span>
  );
}
