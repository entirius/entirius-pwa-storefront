// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import { API_CMS_BLOG_CATEGORIES_ROUTE, API_CMS_BLOG_POST_ROUTE } from "@/API/api.routes";
import type { create_api } from "@/API/api.context";
import type { BlogCategoryRaw, BlogPostRaw, ContentDbPage } from "@/types/blog.types";
import { NORM_BLOG_POST_CARDS, type BlogPostCard } from "@/utils/NORMALIZERS/blog-post.normalizer";

type Api = ReturnType<typeof create_api>;

// Three rows of the three-column grid.
export const BLOG_PAGE_SIZE = 9;

export type BlogPostsPage = { cards: BlogPostCard[]; page: number; pages: number; records: number };

// One page of posts written in a language, newest first; of a category or an author when given ("" = any).
const _load_blog_posts = cache(async (api: Api, language: string, category: string, author: string, page: number) =>
  api.FETCH_METHOD<ContentDbPage<BlogPostRaw>>(API_CMS_BLOG_POST_ROUTE, {
    querys: {
      language,
      page,
      limit: BLOG_PAGE_SIZE,
      ...(category && { category_url_key: category }),
      ...(author && { author }),
    },
  }),
);

// null: the page is past the last one (contentdb answers 404), or the API failed.
export async function load_blog_posts(
  api: Api,
  options: { language: string; page: number; category?: string; author?: string },
): Promise<BlogPostsPage | null> {
  const [error, answer] = await _load_blog_posts(
    api,
    options.language,
    options.category ?? "",
    options.author ?? "",
    options.page,
  );
  if (error || !answer) return null;
  return {
    cards: NORM_BLOG_POST_CARDS(answer.data),
    page: answer.pagination?.page ?? options.page,
    pages: answer.pagination?.pages ?? 1,
    records: answer.pagination?.records ?? 0,
  };
}

// The languages, of those asked, that have posts in this channel (of the author when given): hreflang of a list.
export async function languages_with_posts(api: Api, languages: string[], author?: string): Promise<string[]> {
  const found = await Promise.all(
    [...new Set(languages)].map(async (language) =>
      (await load_blog_posts(api, { language, page: 1, author }))?.records ? language : null,
    ),
  );
  return found.filter((language): language is string => language !== null);
}

export type BlogCategory = { name: string; url_key: string };

// Categories with published posts in a language, as the CMS orders them (newest first).
export const load_blog_categories = cache(async (api: Api, language: string): Promise<BlogCategory[]> => {
  const [error, answer] = await api.FETCH_METHOD<ContentDbPage<BlogCategoryRaw>>(API_CMS_BLOG_CATEGORIES_ROUTE, {
    querys: { language: language.toUpperCase(), limit: 100, page: 1 },
  });
  if (error || !Array.isArray(answer?.data)) return [];
  return answer.data
    .filter((category) => category.url_key && (category.published_posts_count ?? 0) > 0)
    .map((category) => ({ name: category.name, url_key: category.url_key }));
});
