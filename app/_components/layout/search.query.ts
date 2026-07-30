import { API_SEARCH_ROUTE } from "@/API/api.routes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Api = { FETCH_METHOD: (path: string, options?: any) => Promise<any> };

// Raw unified-search response. Product/category items are a "lite" shape that
// differs from the catalog endpoints — intentionally NOT normalized here. All
// shape-mapping happens locally inside the search components so the divergence
// stays contained (see search-feature.md).
export type SearchResponse = {
  products?: { total?: number; results?: any[]; has_next_page?: boolean };
  categories?: { results?: any[] };
  phrases?: { text: string; type: string }[];
};

export const search_query = (
  api: Api,
  { q, scope = "products,categories" }: { q: string; scope?: string },
) => ({
  queryKey: ["search", q, scope] as const,
  queryFn: async (): Promise<SearchResponse> => {
    const [error, response] = await api.FETCH_METHOD(API_SEARCH_ROUTE, {
      querys: { q, scope, limit: 6 },
    });
    if (error) throw new Error(error.message ?? "Search failed");
    return (response ?? {}) as SearchResponse;
  },
});
