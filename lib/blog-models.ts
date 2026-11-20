// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type {
  BlogAuthorModel,
  BlogAuthorProfileModel,
  BlogBylinePart,
  BlogDate,
  BlogPagination,
  BlogPostCardModel,
  BlogPostModel,
} from "@entirius/storefront-sdk/blog";
import { cms_picture } from "@/lib/cms/blocks";
import { blog_author_path, blog_list_path, blog_post_path, page_numbers } from "@/lib/blog-paths";
import {
  format_blog_date,
  updated_later,
  type BlogAuthor,
  type BlogAuthorProfile,
  type BlogPost,
  type BlogPostCard,
} from "@/utils/NORMALIZERS/blog-post.normalizer";

// The normalized posts → what the theme's blog parts show (`@entirius/storefront-sdk/blog`): addresses, dates and
// author lists in the page language.

const date = (iso: string | null, language: string): BlogDate | null => {
  const label = iso ? format_blog_date(iso, language) : "";
  return iso && label ? { iso, label } : null;
};

const names = (language: string) => new Intl.ListFormat(language, { type: "conjunction" });

export function blog_card_model(card: BlogPostCard, language: string): BlogPostCardModel {
  return {
    href: blog_post_path(card.slug),
    language: card.language,
    title: card.title,
    excerpt: card.excerpt,
    cover: cms_picture(card.cover),
    authors: names(language).format(card.authors),
    published: date(card.published_at, language),
  };
}

const author_model = (author: BlogAuthor): BlogAuthorModel => ({
  name: author.name,
  href: author.slug ? blog_author_path(author.slug) : null,
  role: author.role,
  bio: author.bio,
  photo: author.photo,
});

export const blog_author_model = (author: BlogAuthorProfile): BlogAuthorProfileModel => ({
  ...author_model(author),
  links: author.links,
});

// "Anna, Jan and Ewa": the names linked to their pages (a free-text name of an older post has none), the words
// between them as they are.
function byline(authors: BlogAuthor[], language: string): BlogBylinePart[] {
  let next = 0;
  return names(language)
    .formatToParts(authors.map((author) => author.name))
    .map((part) => {
      if (part.type !== "element") return { text: part.value, href: null };
      const author = authors[next++];
      return { text: part.value, href: author.slug ? blog_author_path(author.slug) : null };
    });
}

export function blog_post_model(post: BlogPost, language: string): BlogPostModel {
  return {
    language: post.language,
    title: post.title,
    category: post.category
      ? { name: post.category.name, href: blog_list_path({ category: post.category.url_key }) }
      : null,
    byline: byline(post.authors, language),
    published: date(post.published_at, language),
    updated: updated_later(post) ? date(post.updated_at, language) : null,
    cover: cms_picture(post.cover),
    toc: post.toc,
    authors: post.authors.map(author_model),
    prev: post.prev ? { title: post.prev.title, href: blog_post_path(post.prev.slug) } : null,
    next: post.next ? { title: post.next.title, href: blog_post_path(post.next.slug) } : null,
  };
}

// Page numbers with their addresses; null for a single page. `href`: a page's full address, profile included.
export function blog_pagination(page: number, pages: number, href: (page: number) => string): BlogPagination | null {
  if (pages <= 1) return null;
  return {
    prev: page > 1 ? href(page - 1) : null,
    next: page < pages ? href(page + 1) : null,
    pages: page_numbers(page, pages).map((n) => (n === null ? null : { number: n, href: href(n), current: n === page })),
  };
}
