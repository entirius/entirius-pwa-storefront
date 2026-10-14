// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import { make_static_access } from "@/API/access/api.static-access";
import { create_api } from "@/API/api.context";
import { API_CATEGORIES_ROUTE, API_PRODUCTS_ROUTE } from "@/API/api.routes";
import { DEFAULT_PROFILE, profile_path } from "@/lib/profile-path";
import { PROFILE_NAMES, profile_defaults } from "@/utils/cookies-setter.helper";

// hreflang: one address per profile, in the profile's own language (what a visitor without cookies, a crawler,
// reads there). A language picked in the switch has no address of its own, so it is not an alternate.
export type ProfileView = { profile: string; language: string; currency: string | null; channel: string };

export const PROFILE_VIEWS: ProfileView[] = PROFILE_NAMES.flatMap((profile) => {
  const { language, currency, channel } = profile_defaults(profile);
  return language && channel ? [{ profile, language, currency, channel }] : [];
});

// `en` for the default profile (no country), `pl-PL` for a country's.
export const hreflang = (view: ProfileView) =>
  view.profile === DEFAULT_PROFILE ? view.language : `${view.language}-${view.profile.toUpperCase()}`;

// hreflang → address for the profiles that have the page (path null = not there), `x-default` the default
// profile's. undefined when the page exists in one profile only: nothing to point at.
export function language_alternates(paths: [ProfileView, string | null][]): Record<string, string> | undefined {
  const found = paths.filter((entry): entry is [ProfileView, string] => entry[1] !== null);
  if (found.length < 2) return undefined;
  const languages = Object.fromEntries(found.map(([view, path]) => [hreflang(view), path]));
  const fallback = found.find(([view]) => view.profile === DEFAULT_PROFILE);
  return fallback ? { ...languages, "x-default": fallback[1] } : languages;
}

export const view_api = (view: ProfileView) =>
  create_api(
    make_static_access({ channel: view.channel, language: view.language, currency: view.currency, country: view.profile }),
  );

type Row = { url_key?: string; url_keys?: Record<string, string> | null };

async function first_row(view: ProfileView, route: string, querys: Record<string, string>): Promise<Row | null> {
  const [error, body] = await view_api(view).FETCH_METHOD<{ results?: Row[] } | Row[]>(route, {
    querys,
    signal: AbortSignal.timeout(2_000),
  });
  if (error || !body) return null;
  return (Array.isArray(body) ? body : body.results)?.[0] ?? null;
}

// The key of a product or category in a profile's language, null when the profile does not have it (not in its
// channel, or not written in its language: the API would answer with another language's key and text). A product
// is found by a key of any language, a category only by the page language's; `url_keys` of a product only come
// with `include=full`.
async function key_in(view: ProfileView, kind: "product" | "catalog", key: string, page_language: string) {
  try {
    const row =
      kind === "product"
        ? await first_row(view, API_PRODUCTS_ROUTE, { url_key: key, page_size: "1", include: "full" })
        : await first_row(view, API_CATEGORIES_ROUTE, { url_key: key, language: page_language });
    return row?.url_keys?.[view.language] ?? null;
  } catch {
    return null;
  }
}

// hreflang alternates of a product or category page, one lookup per profile (per request: React cache).
export const catalog_alternates = cache(
  async (kind: "product" | "catalog", key: string, page_language: string) =>
    language_alternates(
      await Promise.all(
        PROFILE_VIEWS.map(async (view): Promise<[ProfileView, string | null]> => {
          const found = await key_in(view, kind, key, page_language);
          return [view, found ? profile_path(view.profile, `/${kind}/${found}`) : null];
        }),
      ),
    ),
);

// hreflang alternates of a CMS page (`/` for home): the profiles whose language the page is written in.
export function page_alternates(path: string, page_languages: string[]) {
  const written = new Set(page_languages.map((language) => language.toLowerCase()));
  return language_alternates(
    PROFILE_VIEWS.map((view) => [view, written.has(view.language) ? profile_path(view.profile, path) : null]),
  );
}
