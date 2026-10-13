// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { MetadataRoute } from "next";
import { connection } from "next/server";
import countries from "@/_CONFIG/countries.config.json";
import { API_CATEGORIES_ROUTE, API_CMS_STATIC_PAGE_ROUTE, API_PRODUCTS_ROUTE } from "@/API/api.routes";
import { make_static_access } from "@/API/access/api.static-access";
import { create_api } from "@/API/api.context";
import { LAYOUT_ROUTE_PREFIX } from "@/app/_components/layout-slots/api.query";
import { SITE_URL } from "@/lib/seo/config";
import { sitemap_url, unique_entries } from "@/lib/seo/sitemap";

type Profile = { default_language: string; default_currency: string; default_channel: string };
const PROFILE = "default";
const DEFAULT_PROFILE = (countries as Record<string, Profile>)[PROFILE];

const PAGE_SIZE = 100;
const MAX_PAGES = 50;
const MAX_CATEGORY_DEPTH = 4;

type Api = ReturnType<typeof create_api>;
type Row = { url_key?: string; has_children?: boolean };

// Categories of every level up to MAX_CATEGORY_DEPTH.
async function category_keys(api: Api, parent?: string, depth = 1): Promise<string[]> {
  const [error, rows] = await api.FETCH_METHOD<Row[]>(API_CATEGORIES_ROUTE, {
    querys: parent ? { parent_url_key: parent } : {},
  });
  if (error || !Array.isArray(rows)) return [];
  const own = rows.flatMap((r) => (r.url_key ? [r.url_key] : []));
  if (depth >= MAX_CATEGORY_DEPTH) return own;
  const nested = await Promise.all(
    rows.filter((r) => r.has_children && r.url_key).map((r) => category_keys(api, r.url_key, depth + 1)),
  );
  return [...own, ...nested.flat()];
}

// Every product, sold-out ones included: they keep their page.
async function product_keys(api: Api): Promise<string[]> {
  const out: string[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const [error, response] = await api.FETCH_METHOD<{ results: Row[]; has_next_page: boolean }>(API_PRODUCTS_ROUTE, {
      querys: { page, page_size: PAGE_SIZE },
    });
    if (error || !response) break;
    out.push(...response.results.flatMap((p) => (p.url_key ? [p.url_key] : [])));
    if (!response.has_next_page) break;
  }
  return out;
}

// Routes of the published CMS pages (the same route can exist in several languages).
async function page_routes(api: Api): Promise<string[]> {
  const [error, response] = await api.FETCH_METHOD<{ data: { routes?: string[] }[] }>(API_CMS_STATIC_PAGE_ROUTE, {
    querys: { limit: 50, page: 1 },
  });
  if (error || !response) return [];
  return response.data
    .map((page) => page.routes?.[0])
    .filter((route): route is string => Boolean(route) && !route!.startsWith(LAYOUT_ROUTE_PREFIX));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection(); // request time: it reads the API, never at build
  const api = create_api(
    make_static_access({
      channel: DEFAULT_PROFILE.default_channel,
      language: DEFAULT_PROFILE.default_language,
      currency: DEFAULT_PROFILE.default_currency,
      country: PROFILE,
    }),
  );
  const [pages, categories, products] = await Promise.all([page_routes(api), category_keys(api), product_keys(api)]);
  return unique_entries([
    ...pages.map((key) => sitemap_url(SITE_URL, PROFILE, "page", key)),
    ...categories.map((key) => sitemap_url(SITE_URL, PROFILE, "catalog", key)),
    ...products.map((key) => sitemap_url(SITE_URL, PROFILE, "product", key)),
  ]);
}
