// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { API_CATEGORIES_ROUTE, API_CMS_STATIC_PAGE_ROUTE, API_PRODUCTS_ROUTE } from "@/API/api.routes";
import { LAYOUT_ROUTE_PREFIX } from "@/app/_components/layout-slots/api.query";
import { PROFILE_VIEWS, view_api, type ProfileView } from "@/lib/seo/alternates";
import { SITE_URL } from "@/lib/seo/config";
import { sitemap_entries, sitemap_path } from "@/lib/seo/sitemap";

const PAGE_SIZE = 100;
const MAX_PAGES = 50;
const MAX_CATEGORY_DEPTH = 4;

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

// Routes of the published CMS pages with the languages each is written in.
async function page_languages(api: Api): Promise<Map<string, Set<string>>> {
  const [error, response] = await api.FETCH_METHOD<{ data: { routes?: string[]; language?: string }[] }>(
    API_CMS_STATIC_PAGE_ROUTE,
    { querys: { limit: 50, page: 1 } },
  );
  const out = new Map<string, Set<string>>();
  for (const page of error || !response ? [] : response.data) {
    const route = page.routes?.[0];
    if (!route || route.startsWith(LAYOUT_ROUTE_PREFIX) || !page.language) continue;
    out.set(route, (out.get(route) ?? new Set()).add(page.language.toLowerCase()));
  }
  return out;
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
      const [categories, products] = await Promise.all([category_rows(api), product_rows(api)]);
      return {
        view,
        catalog: keys_by(categories, "idx", view.language),
        product: keys_by(products, "sku", view.language),
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

  return sitemap_entries(SITE_URL, [
    ...[...pages].map(([route, languages]) =>
      PROFILE_VIEWS.map((view): [ProfileView, string | null] => [
        view,
        languages.has(view.language) ? sitemap_path(view.profile, "page", route) : null,
      ]),
    ),
    ...across("catalog"),
    ...across("product"),
  ]);
}
