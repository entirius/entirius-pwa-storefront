// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { MetadataRoute } from "next";
import { connection } from "next/server";
import {
  API_CATEGORIES_ROUTE,
  API_CMS_BLOG_POST_ROUTE,
  API_CMS_STATIC_PAGE_ROUTE,
  API_PRODUCTS_ROUTE,
} from "@/API/api.routes";
import { LAYOUT_ROUTE_PREFIX } from "@/app/_components/layout-slots/api.query";
import { PROFILE_VIEWS, view_api, type ProfileView } from "@/lib/seo/alternates";
import { SITE_URL } from "@/lib/seo/config";
import { sitemap_entries, sitemap_path } from "@/lib/seo/sitemap";
import { profile_path } from "@/lib/profile-path";
import { BLOG_PATH, blog_author_path, blog_post_path } from "@/lib/blog-paths";
import { is_app_route } from "@/utils/route-exists";

const PAGE_SIZE = 100;
const MAX_PAGES = 50;
const MAX_CATEGORY_DEPTH = 4;
// Blog posts come with their whole content: smaller pages than products.
const POST_PAGE_SIZE = 50;

type Api = ReturnType<typeof view_api>;
type Row = { idx?: string; sku?: string; url_key?: string; url_keys?: Record<string, string> | null; has_children?: boolean };

// Categories of every level up to MAX_CATEGORY_DEPTH, in the api's language.
async function category_rows(api: Api, parent?: string, depth = 1): Promise<Row[]> {
  const [error, rows] = await api.FETCH_METHOD<Row[]>(API_CATEGORIES_ROUTE, {
    querys: parent ? { parent_url_key: parent } : {},
  });
  if (error || !Array.isArray(rows)) return [];
  if (depth >= MAX_CATEGORY_DEPTH) return rows;
  const nested = await Promise.all(
    rows.filter((r) => r.has_children && r.url_key).map((r) => category_rows(api, r.url_key, depth + 1)),
  );
  return [...rows, ...nested.flat()];
}

// Every product, sold-out ones included: they keep their page. `url_keys` only come with `include=full`.
async function product_rows(api: Api): Promise<Row[]> {
  const out: Row[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const [error, response] = await api.FETCH_METHOD<{ results: Row[]; has_next_page: boolean }>(API_PRODUCTS_ROUTE, {
      querys: { page, page_size: PAGE_SIZE, include: "full" },
    });
    if (error || !response) break;
    out.push(...response.results);
    if (!response.has_next_page) break;
  }
  return out;
}

// Routes of the published CMS pages with the languages each is written in; a route an app page took (`blog`) is
// not a page address.
async function page_languages(api: Api): Promise<Map<string, Set<string>>> {
  const [error, response] = await api.FETCH_METHOD<{ data: { routes?: string[]; language?: string }[] }>(
    API_CMS_STATIC_PAGE_ROUTE,
    { querys: { limit: 50, page: 1 } },
  );
  const out = new Map<string, Set<string>>();
  for (const page of error || !response ? [] : response.data) {
    const route = page.routes?.[0];
    if (!route || route.startsWith(LAYOUT_ROUTE_PREFIX) || is_app_route(route) || !page.language) continue;
    out.set(route, (out.get(route) ?? new Set()).add(page.language.toLowerCase()));
  }
  return out;
}

type PostRow = { routes?: string[]; language?: string; authors?: { slug?: string }[]; co_authors?: { slug?: string }[] };

// The blog posts published in the api's channel: each route, and each author's slug, with the languages of the posts.
async function blog_languages(api: Api) {
  const posts = new Map<string, Set<string>>();
  const authors = new Map<string, Set<string>>();
  const add = (map: Map<string, Set<string>>, key: string, language: string) =>
    map.set(key, (map.get(key) ?? new Set()).add(language));
  for (let page = 1; page <= MAX_PAGES; page++) {
    const [error, response] = await api.FETCH_METHOD<{ data: PostRow[]; pagination?: { pages?: number } }>(
      API_CMS_BLOG_POST_ROUTE,
      { querys: { limit: POST_PAGE_SIZE, page } },
    );
    if (error || !response) break;
    for (const post of response.data) {
      const route = post.routes?.[0];
      const language = post.language?.toLowerCase();
      if (!route || !language) continue;
      add(posts, route, language);
      for (const author of [...(post.authors ?? []), ...(post.co_authors ?? [])]) {
        if (author.slug) add(authors, author.slug, language);
      }
    }
    if (page >= (response.pagination?.pages ?? 1)) break;
  }
  return { posts, authors };
}

// Each item (a category by `idx`, a product by `sku`) as its key in the profile's language, if it has one there.
const keys_by = (rows: Row[], id: "idx" | "sku", language: string) =>
  new Map(rows.flatMap((r) => (r[id] && r.url_keys?.[language] ? [[r[id], r.url_keys[language]] as const] : [])));

// Every profile as a crawler reads it (its own language), each address with the page's addresses in the other
// profiles (hreflang). Read from the API at request time, never at build.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  if (!PROFILE_VIEWS.length) return [];
  const [pages, ...views] = await Promise.all([
    page_languages(view_api(PROFILE_VIEWS[0])),
    ...PROFILE_VIEWS.map(async (view) => {
      const api = view_api(view);
      const [categories, products, blog] = await Promise.all([category_rows(api), product_rows(api), blog_languages(api)]);
      return {
        view,
        catalog: keys_by(categories, "idx", view.language),
        product: keys_by(products, "sku", view.language),
        ...blog,
      };
    }),
  ]);

  const across = (kind: "catalog" | "product") =>
    [...new Set(views.flatMap((v) => [...v[kind].keys()]))].map((id) =>
      views.map(({ view, ...keys }): [ProfileView, string | null] => {
        const key = keys[kind].get(id);
        return [view, key ? sitemap_path(view.profile, kind, key) : null];
      }),
    );
  // The blog, a post and an author's page in the profiles whose channel publishes posts (the post, the author's) in
  // the profile's language.
  const blog = (kind: "posts" | "authors", path: (key: string) => string) =>
    [...new Set(views.flatMap((v) => [...v[kind].keys()]))].map((key) =>
      views.map((v): [ProfileView, string | null] => [
        v.view,
        v[kind].get(key)?.has(v.view.language) ? profile_path(v.view.profile, path(key)) : null,
      ]),
    );
  const blog_list = views.map((v): [ProfileView, string | null] => [
    v.view,
    [...v.posts.values()].some((languages) => languages.has(v.view.language))
      ? profile_path(v.view.profile, BLOG_PATH)
      : null,
  ]);

  return sitemap_entries(SITE_URL, [
    ...[...pages].map(([route, languages]) =>
      PROFILE_VIEWS.map((view): [ProfileView, string | null] => [
        view,
        languages.has(view.language) ? sitemap_path(view.profile, "page", route) : null,
      ]),
    ),
    ...across("catalog"),
    ...across("product"),
    blog_list,
    ...blog("posts", blog_post_path),
    ...blog("authors", blog_author_path),
  ]);
}
