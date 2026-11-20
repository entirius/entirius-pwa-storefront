// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Globe } from "lucide-react";
import type { BlogAuthorPageProps } from "@entirius/storefront-sdk/blog";
import { AuthorPhoto } from "@theme/blog/author-photo";
import { PostGrid } from "@theme/blog/post-grid";
import { BlogPagination } from "@theme/blog/pagination";

// An author: photo, role, bio, website and social profiles, then their posts in the page language.
export function AuthorPage({ t, author, posts, pagination }: BlogAuthorPageProps) {
  return (
    <>
      <header className="surface flex flex-col gap-6 sm:flex-row sm:items-center">
        <AuthorPhoto author={author} size="lg" />
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl leading-tight md:text-5xl">{author.name}</h1>
          {author.role && <p className="text-muted-foreground">{author.role}</p>}
          {author.bio && <p className="max-w-prose">{author.bio}</p>}
          {author.links.length > 0 && (
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {author.links.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener me" className="link inline-flex items-center gap-1.5">
                    <Globe aria-hidden className="size-4" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>
      <section className="flex flex-col gap-6 py-8">
        <h2 className="text-2xl md:text-3xl">{t("blog.author_posts", { name: author.name })}</h2>
        <PostGrid t={t} posts={posts} heading="h3" />
        <BlogPagination pagination={pagination} />
      </section>
    </>
  );
}
