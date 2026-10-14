// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { create_api } from "@/API/api.context";
import { API_CATEGORIES_ROUTE } from "@/API/api.routes";
import { LANGUAGES } from "@/lib/languages";

type Api = ReturnType<typeof create_api>;
type Row = { url_key?: string; url_keys?: Record<string, string> | null };

// A category url key belongs to one language (`chairs` / `krzesla`), and `categories/?url_key=` only finds the
// active language's. Every row carries `url_keys` ({language: key}), which is how a key of another language is
// turned into the active one.
const variants = (row: Row) => [row.url_key, ...Object.values(row.url_keys ?? {})].filter(Boolean) as string[];

async function rows(api: Api, keys: string[], language?: string): Promise<Row[]> {
  const [error, response] = await api.FETCH_METHOD<{ results?: Row[] } | Row[]>(API_CATEGORIES_ROUTE, {
    querys: { url_key: keys, ...(language && { language }) },
  });
  if (error || !response) return [];
  return Array.isArray(response) ? response : (response.results ?? []);
}

// The active language's key of each given key, in the given order; a key no language knows stays as it is.
export async function localize_category_keys(api: Api, keys: string[]): Promise<string[]> {
  if (!keys.length) return keys;
  const active = await rows(api, keys);
  const missing = keys.filter((key) => !active.some((row) => variants(row).includes(key)));
  let found = active;
  if (missing.length) {
    const elsewhere = (await Promise.all(LANGUAGES.map((language) => rows(api, missing, language)))).flat();
    const all_variants = [...new Set(elsewhere.flatMap(variants))];
    found = [...active, ...(all_variants.length ? await rows(api, all_variants) : [])];
  }
  return keys.map((key) => found.find((row) => variants(row).includes(key))?.url_key ?? key);
}
