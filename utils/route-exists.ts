// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import channels from "@/_CONFIG/channels.config.json";
import { make_static_access } from "@/API/access/api.static-access";
import { create_api } from "@/API/api.context";
import {
  API_CATEGORIES_ROUTE,
  API_CMS_BLOG_AUTHORS_ROUTE,
  API_CMS_BLOG_POST_ROUTE,
  API_CMS_STATIC_PAGE_ROUTE,
  API_PRODUCTS_ROUTE,
} from "@/API/api.routes";
import { LAYOUT_ROUTE_PREFIX } from "@/app/_components/layout-slots/api.query";
import { LANGUAGES } from "@/lib/languages";

// Existence check behind real 404 status codes. The page itself cannot answer 404: the response is
// streamed (200) before the page runs, so notFound() only swaps the body. proxy.ts asks here before
// the request reaches the page.
//
// Answers are cached in memory for a minute (positive and negative), at most MAX_ENTRIES of them, and
// concurrent asks for the same address share one lookup. Any doubt (unknown channel, API down, timeout,
// unexpected answer) counts as "exists": the page then decides, as it did before.
const TTL_MS = 60_000;
const TIMEOUT_MS = 2_000;
const MAX_ENTRIES = 1_000;
// `keys`: a category's url key per language ({en: "chairs", pl: "krzesla"}), for the redirect to the active one.
type Answer = { exists: boolean; keys?: Record<string, string> };
const cache = new Map<string, Answer & { until: number }>();
const pending = new Map<string, Promise<Answer>>();

// First path segments that are app routes, not CMS pages (catch-all `(builder)/[[...slug]]`).
// A new top-level app route must be added here.
const APP_ROUTES = new Set([
  "cart",
  "checkout",
  "profile",
  "user-handler",
  "reset-password",
  "stylesheets",
  "catalog",
  "product",
  "search",
  "blog",
]);

// Whether a first path segment is an app route: a CMS page with that route is not reachable as a page.
export const is_app_route = (segment: string) => APP_ROUTES.has(segment);

const CHANNELS = new Set(Object.keys(channels));

// The request's profile, as the page will see it (cookies set by proxy.ts).
export type RouteContext = {
  channel: string;
  language?: string | null;
  currency?: string | null;
  country?: string | null;
};

type Api = ReturnType<typeof create_api>;

type Hit = { exists: boolean; rows?: { url_keys?: Record<string, string> | null }[] };

async function ask(api: Api, route: string, querys: Record<string, string>, listing_key: string): Promise<Hit> {
  try {
    const [error, body] = await api.FETCH_METHOD<Record<string, unknown>>(route, {
      querys,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (error) return { exists: error.status !== 400 && error.status !== 404 };
    const list = body?.[listing_key] ?? body;
    return Array.isArray(list) ? { exists: list.length > 0, rows: list } : { exists: true };
  } catch {
    return { exists: true };
  }
}

async function lookup(kind: string, key: string, ctx: RouteContext): Promise<Answer> {
  const api = create_api(make_static_access(ctx));
  if (kind === "product") {
    return { exists: (await ask(api, API_PRODUCTS_ROUTE, { url_key: key, page_size: "1" }, "results")).exists };
  }
  if (kind === "catalog") {
    // url_key is matched per language: a category exists when any language of any profile has it.
    const hits = await Promise.all(
      LANGUAGES.map((language) => ask(api, API_CATEGORIES_ROUTE, { url_key: key, language }, "results")),
    );
    const keys = hits.flatMap((hit) => hit.rows ?? []).find((row) => row.url_keys)?.url_keys ?? undefined;
    return { exists: hits.some((hit) => hit.exists), keys };
  }
  if (kind === "blog") {
    // In any language: the page shows a post written in another one.
    return { exists: (await ask(api, API_CMS_BLOG_POST_ROUTE, { routes: key, limit: "1", page: "1" }, "data")).exists };
  }
  if (kind === "blog-author") {
    return { exists: (await ask(api, `${API_CMS_BLOG_AUTHORS_ROUTE}${encodeURIComponent(key)}/`, {}, "data")).exists };
  }
  return { exists: (await ask(api, API_CMS_STATIC_PAGE_ROUTE, { routes: key, limit: "1", page: "1" }, "data")).exists };
}

function remember(cache_key: string, answer: Answer) {
  cache.delete(cache_key);
  cache.set(cache_key, { ...answer, until: Date.now() + TTL_MS });
  // Map keeps insertion order: the first entries are the oldest.
  for (const old of cache.keys()) {
    if (cache.size <= MAX_ENTRIES) break;
    cache.delete(old);
  }
}

// Path segments arrive percent-encoded (`regal%C5%82`); the API engine encodes the key itself.
function decode(segment: string | undefined): string | undefined | null {
  if (segment === undefined) return undefined;
  try {
    return decodeURIComponent(segment);
  } catch {
    return null; // malformed escape: no answer
  }
}

async function answer(segments: string[], ctx: RouteContext): Promise<Answer & { kind?: string; key?: string }> {
  const [first, second, third] = segments.slice(0, 3).map(decode);
  if (first === null || second === null || third === null) return { exists: true };
  if (!first) return { exists: true }; // home
  if (first.startsWith(LAYOUT_ROUTE_PREFIX)) return { exists: false }; // layout slots are not pages (the builder answers 404)
  // `/blog/<slug>` is a post, `/blog/authors/<slug>` an author (`/blog/authors` alone: a post called "authors").
  const author = first === "blog" && second === "authors" && !!third;
  const kind = author
    ? "blog-author"
    : first === "product" || first === "catalog" || (first === "blog" && second)
      ? first
      : APP_ROUTES.has(first)
        ? null
        : "page";
  const key = kind === "page" ? first : author ? third : second;
  if (!kind || !key) return { exists: true };
  if (!CHANNELS.has(ctx.channel)) return { exists: true }; // a channel this shop does not serve: the page decides

  const cache_key = `${ctx.channel}|${kind}|${key}`;
  const hit = cache.get(cache_key);
  if (hit && hit.until > Date.now()) return { ...hit, kind, key };
  if (hit) cache.delete(cache_key);

  let running = pending.get(cache_key);
  if (!running) {
    running = lookup(kind, key, ctx)
      .then((found) => {
        remember(cache_key, found);
        return found;
      })
      .finally(() => pending.delete(cache_key));
    pending.set(cache_key, running);
  }
  return { ...(await running), kind, key };
}

// `segments`: the path without the country segment, as in the URL. Returns false only for a known-missing
// address.
export async function route_exists(segments: string[], ctx: RouteContext): Promise<boolean> {
  return (await answer(segments, ctx)).exists;
}

// For a category address written with another language's key (`/pl/catalog/chairs`): the active language's
// key (`krzesla`). null when the key is already the active one, or nothing is known.
export async function localized_catalog_key(segments: string[], ctx: RouteContext): Promise<string | null> {
  const found = await answer(segments, ctx);
  if (found.kind !== "catalog" || !found.exists || !ctx.language) return null;
  const target = found.keys?.[ctx.language];
  return target && target !== found.key ? target : null;
}

// Test hook: the cache is module state.
export function clear_route_cache() {
  cache.clear();
  pending.clear();
}
