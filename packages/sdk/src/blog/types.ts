// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { ReactNode } from "react";
import type { Translate } from "../i18n/translate";
import type { CmsPicture } from "../cms/types";

// The blog's pages are theme parts rendered on the server (`@theme/blog/*`), like CMS blocks: the core reads the
// posts and hands each part what it shows, dates and author lists already in the page language. Addresses are shop
// paths for <Link>, except where a type says otherwise.

// A date as the page shows it, with its ISO value for <time dateTime>.
export type BlogDate = { iso: string; label: string };

// A post on a list (the blog, an author's page, a CMS `section-blog`). `language`: the post's, when it differs
// from the page's it goes into `lang`. `authors`: the names as one phrase ("Anna and Jan").
export type BlogPostCardModel = {
  href: string;
  language: string;
  title: string;
  excerpt: string;
  cover: CmsPicture | null;
  authors: string;
  published: BlogDate | null;
};

// Numbered pages. These are full addresses (the country's profile included), for plain links: a page of the list
// loads whole. `pages`: null marks a gap ("…").
export type BlogPagination = {
  prev: string | null;
  next: string | null;
  pages: ({ number: number; href: string; current: boolean } | null)[];
};

// "All" and a tab per category with posts.
export type BlogCategoryTab = { name: string; href: string; current: boolean };

// An author of a post; `href` null for a free-text name of an older post.
export type BlogAuthorModel = { name: string; href: string | null; role: string; bio: string; photo: string | null };

// The author's page: the same, with their website and social profiles (named by their host).
export type BlogAuthorProfileModel = BlogAuthorModel & { links: { url: string; label: string }[] };

// The byline "Anna, Jan and Ewa" in pieces: the names (linked when the author has a page) and the words between.
export type BlogBylinePart = { text: string; href: string | null };

export type BlogPostModel = {
  language: string;
  title: string;
  category: { name: string; href: string } | null;
  byline: BlogBylinePart[];
  published: BlogDate | null;
  // Set only when the post was edited on a later day.
  updated: BlogDate | null;
  cover: CmsPicture | null;
  // The post's H2 headings and its FAQ: anchors in the body.
  toc: { id: string; text: string }[];
  authors: BlogAuthorModel[];
  prev: { title: string; href: string } | null;
  next: { title: string; href: string } | null;
};

// `@theme/blog/blog-page`: the list. `intro`: the CMS page published under the route `blog`, rendered by the core
// (its sections above the tabs); null shows the plain heading.
export type BlogListPageProps = {
  t: Translate;
  intro: ReactNode | null;
  tabs: BlogCategoryTab[];
  posts: BlogPostCardModel[];
  pagination: BlogPagination | null;
};

// `@theme/blog/post-page`: a post. `body`: its CMS blocks, rendered by the core.
export type BlogPostPageProps = { t: Translate; post: BlogPostModel; body: ReactNode };

// `@theme/blog/author-page`: an author and their posts in the page language.
export type BlogAuthorPageProps = {
  t: Translate;
  author: BlogAuthorProfileModel;
  posts: BlogPostCardModel[];
  pagination: BlogPagination | null;
};
