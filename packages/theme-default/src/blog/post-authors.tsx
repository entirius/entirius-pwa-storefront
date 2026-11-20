// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { BlogAuthorModel } from "@entirius/storefront-sdk/blog";
import { Link } from "@entirius/storefront-sdk/components/link";
import type { Translate } from "@entirius/storefront-sdk/i18n";
import { AuthorPhoto } from "@theme/blog/author-photo";

// "About the author" after the text: role and bio in the page language. Authors with nothing but a name are already
// in the byline, so the card is left out when none has more.
export function PostAuthors({ t, authors }: { t: Translate; authors: BlogAuthorModel[] }) {
  if (!authors.some((author) => author.role || author.bio || author.photo)) return null;
  return (
    <section className="surface flex flex-col gap-5">
      <h2 className="text-xl">{t("blog.about_author", { count: authors.length })}</h2>
      {authors.map((author) => (
        <div key={author.href ?? author.name} className="flex gap-4">
          <AuthorPhoto author={author} />
          <div className="flex flex-col gap-1">
            <p className="font-brand text-lg text-heading">
              {author.href ? (
                <Link href={author.href} className="hover:underline">
                  {author.name}
                </Link>
              ) : (
                author.name
              )}
            </p>
            {author.role && <p className="text-sm text-muted-foreground">{author.role}</p>}
            {author.bio && <p className="mt-1 text-sm">{author.bio}</p>}
          </div>
        </div>
      ))}
    </section>
  );
}
