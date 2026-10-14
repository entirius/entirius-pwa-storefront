// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import channels from "@/_CONFIG/channels.config.json";
import { make_static_access } from "@/API/access/api.static-access";
import { create_api } from "@/API/api.context";
import { API_CATEGORIES_ROUTE, API_CMS_STATIC_PAGE_ROUTE, API_PRODUCTS_ROUTE } from "@/API/api.routes";
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
const cache = new Map<string, { exists: boolean; until: number }>();
const pending = new Map<string, Promise<boolean>>();

// First path segments that are app routes, not CMS pages (catch-all `(builder)/[[...slug]]`).
// A new top-level app route must be added here.
const APP_ROUTES = new Set(["cart", "checkout", "profile", "user-handler", "stylesheets", "catalog", "product"]);

const CHANNELS = new Set(Object.keys(channels));

// The request's profile, as the page will see it (cookies set by proxy.ts).
export type RouteContext = {
  channel: string;
  language?: string | null;
  currency?: string | null;
  country?: string | null;
};

type Api = ReturnType<typeof create_api>;

async function ask(api: Api, route: string, querys: Record<string, string>, listing_key: string): Promise<boolean> {
  try {
    const [error, body] = await api.FETCH_METHOD<Record<string, unknown>>(route, {
      querys,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (error) return error.status !== 400 && error.status !== 404;
    const list = body?.[listing_key] ?? body;
    return Array.isArray(list) ? list.length > 0 : true;
  } catch {
    return true;
  }
}

async function lookup(kind: string, key: string, ctx: RouteContext): Promise<boolean> {
  const api = create_api(make_static_access(ctx));
  if (kind === "product") {
    return ask(api, API_PRODUCTS_ROUTE, { url_key: key, page_size: "1" }, "results");
  }
  if (kind === "catalog") {
    // url_key is matched per language: a category exists when any language of any profile has it.
    const hits = await Promise.all(
      LANGUAGES.map((language) => ask(api, API_CATEGORIES_ROUTE, { url_key: key, language }, "results")),
    );
    return hits.some(Boolean);
  }
  return ask(api, API_CMS_STATIC_PAGE_ROUTE, { routes: key, limit: "1", page: "1" }, "data");
}

function remember(cache_key: string, exists: boolean) {
  cache.delete(cache_key);
  cache.set(cache_key, { exists, until: Date.now() + TTL_MS });
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

// `segments`: the path without the country segment, as in the URL. Returns false only for a known-missing
// address.
export async function route_exists(segments: string[], ctx: RouteContext): Promise<boolean> {
  const [first, second] = segments.slice(0, 2).map(decode);
  if (first === null || second === null) return true;
  if (!first) return true; // home
  if (first.startsWith(LAYOUT_ROUTE_PREFIX)) return false; // layout slots are not pages (the builder answers 404)
  const kind = first === "product" || first === "catalog" ? first : APP_ROUTES.has(first) ? null : "page";
  const key = kind === "page" ? first : second;
  if (!kind || !key) return true;
  if (!CHANNELS.has(ctx.channel)) return true; // a channel this shop does not serve: the page decides

  const cache_key = `${ctx.channel}|${kind}|${key}`;
  const hit = cache.get(cache_key);
  if (hit && hit.until > Date.now()) return hit.exists;
  if (hit) cache.delete(cache_key);

  const running = pending.get(cache_key);
  if (running) return running;
  const ask_api = lookup(kind, key, ctx)
    .then((exists) => {
      remember(cache_key, exists);
      return exists;
    })
    .finally(() => pending.delete(cache_key));
  pending.set(cache_key, ask_api);
  return ask_api;
}

// Test hook: the cache is module state.
export function clear_route_cache() {
  cache.clear();
  pending.clear();
}
