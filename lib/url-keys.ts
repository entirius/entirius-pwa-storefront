// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { create_api } from "@/API/api.context";
import { API_CATEGORIES_ROUTE, API_PRODUCTS_ROUTE } from "@/API/api.routes";
import { LANGUAGES } from "@/lib/languages";

type Api = ReturnType<typeof create_api>;
type Rows = { results?: { url_keys?: Record<string, string> }[] } | null;
export type KeyKind = "catalog" | "product";
export type LinkTarget = { kind: KeyKind; key: string };

// What a CMS button points at, when it points at a catalog or a product: the `catalog` / `product` types, and
// the `/c/<key>` / `/p/<key>` convention of the `internal` type. null for every other button.
export function link_target(type: string | undefined, url: string | undefined): LinkTarget | null {
  if (!url) return null;
  if (type === "catalog" || type === "product") return { kind: type, key: url };
  if (type !== "internal") return null;
  const [, prefix, key] = url.match(/^\/?(p|c)\/([^/?#]+)/) ?? [];
  return key ? { kind: prefix === "p" ? "product" : "catalog", key } : null;
}

// CMS buttons carry the url key of one language (the one the editor typed). The shop answers both, but only the
// active language's key is the canonical address, so links are rewritten to it. Any trouble: the given key.
async function category_key(api: Api, key: string, language: string): Promise<string | null> {
  for (const lg of [language, ...LANGUAGES.filter((l) => l !== language)]) {
    const [error, response] = await api.FETCH_METHOD(API_CATEGORIES_ROUTE, { querys: { url_key: key, language: lg } });
    const row = error ? null : (response as Rows)?.results?.[0];
    if (row) return row.url_keys?.[language] ?? null;
  }
  return null;
}

async function product_key(api: Api, key: string, language: string): Promise<string | null> {
  const [error, response] = await api.FETCH_METHOD(API_PRODUCTS_ROUTE, { querys: { url_key: key, page_size: 1 } });
  return error ? null : ((response as Rows)?.results?.[0]?.url_keys?.[language] ?? null);
}

export const url_key_query = (api: Api, language: string, kind: KeyKind, key: string) => ({
  queryKey: ["url-key", language, kind, key],
  staleTime: 10 * 60_000,
  queryFn: async (): Promise<string> => {
    const found = await (kind === "catalog" ? category_key(api, key, language) : product_key(api, key, language));
    return found ?? key;
  },
});

// Every catalog / product button of a CMS document, so the page can resolve them on the server.
export function link_keys(node: unknown, found: Map<string, LinkTarget> = new Map()): LinkTarget[] {
  if (Array.isArray(node)) node.forEach((n) => link_keys(n, found));
  else if (node && typeof node === "object") {
    const { type, url } = node as { type?: string; url?: unknown };
    const target = link_target(type, typeof url === "string" ? url : undefined);
    if (target) found.set(`${target.kind}:${target.key}`, target);
    Object.values(node).forEach((n) => link_keys(n, found));
  }
  return [...found.values()];
}
