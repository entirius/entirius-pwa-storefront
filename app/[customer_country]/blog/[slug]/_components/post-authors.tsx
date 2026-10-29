// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { get_i18n } from "@/lib/i18n/i18n.server";
import { LinkDynamic } from "@/lib/link-dynamic";
import { blog_author_path } from "@/lib/blog-paths";
import type { BlogAuthor } from "@/utils/NORMALIZERS/blog-post.normalizer";
import { AuthorPhoto } from "../../_components/author-photo";

// "About the author" after the text: role and bio in the page language. Authors with nothing but a name are already
// in the byline, so the card is left out when none has more.
export async function PostAuthors({ authors }: { authors: BlogAuthor[] }) {
  if (!authors.some((author) => author.role || author.bio || author.photo)) return null;
  const { t } = await get_i18n();
  return (
    <section className="surface flex flex-col gap-5">
      <h2 className="text-xl">{t("blog.about_author", { count: authors.length })}</h2>
      {authors.map((author) => (
        <div key={author.slug || author.name} className="flex gap-4">
          <AuthorPhoto author={author} />
          <div className="flex flex-col gap-1">
            <p className="font-brand text-lg text-heading">
              {author.slug ? (
                <LinkDynamic href={blog_author_path(author.slug)} className="hover:underline">
                  {author.name}
                </LinkDynamic>
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
