// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { MenuCategory } from "@entirius/storefront-sdk/layout";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { NORM_CATEGORY_BRANCH } from "@/utils/NORMALIZERS/category.normalizer";
import { categories_query } from "./menu.query";
import { CONFIG_QUERY } from "./menu-config";

const useApi = () => useMemo(() => create_api(make_client_access()), []);

// The configured top level (the server prefetches it), or a parent's children with the parent's own row first: a
// row with children only leads deeper, so this is the way to the collective category. Each level is cached by
// its own key and loads on first use.
export function useMenuBranch(parent: { url_key: string; name: string } | null) {
  const api = useApi();
  const { data, isLoading, isError, error } = useQuery({
    ...categories_query(api, parent ? { parent_url_key: parent.url_key } : CONFIG_QUERY),
    refetchOnWindowFocus: false,
  });
  const rows: MenuCategory[] = data?.data ?? [];
  return {
    categories: parent ? NORM_CATEGORY_BRANCH(parent, rows) : rows,
    loading: isLoading,
    error: isError ? ((error as Error)?.message ?? "") : null,
  };
}

export function usePrefetchMenuBranch() {
  const api = useApi();
  const client = useQueryClient();
  return (url_key: string) => void client.prefetchQuery(categories_query(api, { parent_url_key: url_key }));
}
