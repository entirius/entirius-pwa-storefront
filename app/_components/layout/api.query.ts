import { API_CATEGORIES_ROUTE } from "@/API/api.routes";
import { NORM_CATEGORIES_DATA } from "@/utils/NORMALIZERS/category.normalizer";
import type { CONFIG_QUERY } from "./menu-config";

type Api = { FETCH_METHOD: (path: string, options?: any) => Promise<any> };

type CategoriesOptions = CONFIG_QUERY;

export const categories_query = (api: Api, options: CategoriesOptions) => ({
  queryKey: ["categories", options],
  // Shared across both responsive menu slots; positive staleTime keeps the
  // root request deduped to a single network call.
  staleTime: 5 * 60_000,
  queryFn: async () => {
    const [error, response] = await api.FETCH_METHOD(API_CATEGORIES_ROUTE, {
      querys: options,
    });
    if (error) throw new Error(error.message);

    // parent_url_key/no-params return a top-level array; a url_key lookup
    // returns `{ results: [...] }` (some routes return `{ data: [...] }`).
    const rows = Array.isArray(response)
      ? response
      : (response?.data ?? response?.results ?? []);
    const meta = Array.isArray(response) ? undefined : response?.meta;

    return { data: NORM_CATEGORIES_DATA(rows), meta };
  },
});
