// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { API_BASE_URL } from "@/_CONFIG/app.config.json";
import countries from "@/_CONFIG/countries.config.json";
import { LAYOUT_ROUTE_PREFIX } from "@/app/_components/layout-slots/api.query";

// Existence check behind real 404 status codes. The page itself cannot answer 404: the response is
// streamed (200) before the page runs, so notFound() only swaps the body. proxy.ts asks here before
// the request reaches the page.
//
// Answers are cached in memory for a minute (positive and negative). Any doubt (API down, timeout,
// unexpected answer) counts as "exists": the page then decides, as it did before.
const TTL_MS = 60_000;
const TIMEOUT_MS = 2_000;
const cache = new Map<string, { exists: boolean; until: number }>();

// First path segments that are app routes, not CMS pages (catch-all `(builder)/[[...slug]]`).
// A new top-level app route must be added here.
const APP_ROUTES = new Set(["cart", "checkout", "profile", "user-handler", "stylesheets", "catalog", "product"]);

// url_key is matched per language: a category exists when any language of any profile has it.
const LANGUAGES = [
  ...new Set(Object.values(countries as Record<string, { languages?: string[] }>).flatMap((c) => c.languages ?? [])),
];

async function ask(path: string, listing_key: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (res.status === 400 || res.status === 404) return false;
    if (!res.ok) return true;
    const body = await res.json();
    return (body?.[listing_key] ?? body)?.length > 0;
  } catch {
    return true;
  }
}

async function lookup(kind: string, key: string, channel: string): Promise<boolean> {
  const q = encodeURIComponent(key);
  if (kind === "product") {
    return ask(`/api/matrix/v2/${channel}/products/?url_key=${q}&page_size=1`, "results");
  }
  if (kind === "catalog") {
    const hits = await Promise.all(
      LANGUAGES.map((lg) => ask(`/api/matrix/v2/${channel}/categories/?url_key=${q}&language=${lg}`, "results")),
    );
    return hits.some(Boolean);
  }
  return ask(`/api/contentdb/v1/published/static-page/?routes=${q}&limit=1&page=1`, "data");
}

// Path segments arrive percent-encoded (`regal%C5%82`); the lookup encodes the key itself.
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
export async function route_exists(segments: string[], channel: string): Promise<boolean> {
  const [first, second] = segments.slice(0, 2).map(decode);
  if (first === null || second === null) return true;
  if (!first) return true; // home
  if (first.startsWith(LAYOUT_ROUTE_PREFIX)) return false; // layout slots are not pages (the builder answers 404)
  const kind = first === "product" || first === "catalog" ? first : APP_ROUTES.has(first) ? null : "page";
  const key = kind === "page" ? first : second;
  if (!kind || !key) return true;

  const cache_key = `${channel}|${kind}|${key}`;
  const hit = cache.get(cache_key);
  if (hit && hit.until > Date.now()) return hit.exists;
  const exists = await lookup(kind, key, channel);
  cache.set(cache_key, { exists, until: Date.now() + TTL_MS });
  return exists;
}
