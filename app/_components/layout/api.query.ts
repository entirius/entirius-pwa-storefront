// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { create_api } from "@/API/api.context";
import { API_CATEGORIES_ROUTE } from "@/API/api.routes";
import { NORM_CATEGORIES_DATA } from "@/utils/NORMALIZERS/category.normalizer";
import { localize_category_keys } from "@/lib/category-keys";
import type { CONFIG_QUERY } from "./menu-config";

type Api = ReturnType<typeof create_api>;

type CategoriesOptions = CONFIG_QUERY;

export const categories_query = (api: Api, options: CategoriesOptions) => ({
  queryKey: ["categories", options],
  // Shared across both responsive menu slots; positive staleTime keeps the
  // root request deduped to a single network call.
  staleTime: 5 * 60_000,
  queryFn: async () => {
    const ask = async (querys: CategoriesOptions) => {
      const [error, response] = await api.FETCH_METHOD<{ data?: unknown[]; results?: unknown[]; meta?: unknown } | unknown[]>(
        API_CATEGORIES_ROUTE,
        { querys },
      );
      if (error) throw new Error(error.message);
      // parent_url_key/no-params return a top-level array; a url_key lookup
      // returns `{ results: [...] }` (some routes return `{ data: [...] }`).
      const rows: unknown[] = Array.isArray(response) ? response : (response?.data ?? response?.results ?? []);
      return { rows, meta: Array.isArray(response) ? undefined : response?.meta };
    };

    let { rows, meta } = await ask(options);
    // Configured keys are written in one language (MENU_CINFGURATION.CONFIG_QUERY); in another, the lookup
    // finds fewer of them: ask again with the active language's keys.
    const keys = options.url_key ? [options.url_key].flat() : [];
    const parent = options.parent_url_key;
    if ((keys.length && rows.length < keys.length) || (parent && !rows.length)) {
      const localized = { ...options };
      if (keys.length) localized.url_key = await localize_category_keys(api, keys);
      if (parent) [localized.parent_url_key] = await localize_category_keys(api, [parent]);
      ({ rows, meta } = await ask(localized));
    }

    return { data: NORM_CATEGORIES_DATA(rows), meta };
  },
});
