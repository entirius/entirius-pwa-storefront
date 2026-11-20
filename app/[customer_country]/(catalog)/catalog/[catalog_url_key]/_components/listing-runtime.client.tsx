// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useTransition, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import {
  ListingPageProvider,
  type FiltersPlace,
  type ListingFilters,
  type ListingHooks,
  type ListingPageModel,
  type SortDirection,
} from "@entirius/storefront-sdk/catalog/listing";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { NotifySimilar } from "@/components/notify-similar.client";
import { catalog_query, filters_query, type ListingOptions } from "../api.query";
import { useFiltersStore, to_filter_key } from "./filters.store";

const FILTER_PREFIXES = ["q_", "s_", "r_"];
const is_filter = (key: string) => FILTER_PREFIXES.some((prefix) => key.startsWith(prefix));

// The listing's query options for the filter hooks below; null while there is no list (a short search phrase).
const OptionsContext = createContext<ListingOptions | null>(null);
// Asked for by a disabled query only.
const NO_LIST: ListingOptions = { page: "1", page_size: "0" };

// The URL without the filters and the page: what Apply and Clear start from.
function without_filters(search_params: URLSearchParams) {
  const params = new URLSearchParams(search_params.toString());
  Array.from(params.keys()).filter(is_filter).forEach((key) => params.delete(key));
  params.delete("page");
  return params;
}

function useFilters(place: FiltersPlace): ListingFilters {
  const options = useContext(OptionsContext);
  const router = useRouter();
  const search_params = useSearchParams();
  const api = useMemo(() => create_api(make_client_access()), []);

  // Before the paint, so the panel never shows the previous choices. The sidebar and the sheet share the store and
  // follow the filters in the URL; the sheet unmounts on every close, so only the sidebar (mounted, hidden below lg)
  // clears the store when it goes.
  const init = useFiltersStore((s) => s.init);
  const clear_store = useFiltersStore((s) => s.clear);
  const applied_filters = new URLSearchParams(Array.from(search_params).filter(([key]) => is_filter(key))).toString();
  useLayoutEffect(() => {
    init(new URLSearchParams(applied_filters));
  }, [init, applied_filters]);
  useLayoutEffect(
    () => () => {
      if (place === "sidebar") clear_store();
    },
    [place, clear_store],
  );

  const chosen = useFiltersStore((s) => s.active_filters.length + Object.keys(s.active_ranges).length);

  const apply = useCallback(() => {
    // Read the store when applying: no subscription for it.
    const { active_filters, active_ranges } = useFiltersStore.getState();
    const params = without_filters(search_params);
    active_filters.forEach(([filter, option]) => params.append(filter, option));
    Object.entries(active_ranges).forEach(([key, [min, max]]) => {
      params.append(key, String(min));
      params.append(key, String(max));
    });
    router.push(`?${params.toString()}`);
  }, [router, search_params]);

  const clear = useCallback(() => {
    useFiltersStore.getState().clear();
    router.push(`?${without_filters(search_params).toString()}`);
  }, [router, search_params]);

  const { data: response, isLoading, isFetching, isError } = useQuery({
    ...filters_query(api, options ?? NO_LIST),
    enabled: !!options,
    refetchOnWindowFocus: false,
  });

  const groups = response?.data;
  return {
    status: isLoading ? "loading" : !groups || isError ? "error" : "ready",
    updating: isFetching,
    sort: Object.values(groups?.s_ ?? {}).flatMap((filter) => filter.options ?? []),
    ranges: Object.entries(groups?.r_ ?? {}).map(([idx, filter]) => ({
      idx,
      label: filter.label,
      min: Math.floor(filter.min_value),
      max: Math.ceil(filter.max_value),
    })),
    filters: Object.entries(groups?.q_ ?? {}).map(([idx, filter]) => ({
      idx,
      label: filter.label,
      options: filter.options ?? [],
    })),
    applied: Array.from(search_params.keys()).some(is_filter),
    chosen,
    apply,
    clear,
  };
}

function useAppliedFilters() {
  const search_params = useSearchParams();
  // A sheet closed without Apply drops its choices: the store follows the URL again.
  const discard_choices = useCallback(() => useFiltersStore.getState().init(search_params), [search_params]);
  return { applied: Array.from(search_params.keys()).some(is_filter), discard_choices };
}

// One subscription per option, and no re-render while the returned values stay equal.
function useFilterOption(filter: string, option: string) {
  const { checked, toggle } = useFiltersStore(
    useShallow((s) => ({ checked: s.active_set.has(to_filter_key(filter, option)), toggle: s.toggle })),
  );
  return { checked, toggle: useCallback(() => toggle([filter, option]), [toggle, filter, option]) };
}

// URL key s_<criterion> with ASC or DESC (s_name=ASC → sort: { name: ["ASC"] }); one criterion at a time.
function useSortCriterion(criterion: string) {
  const key = `s_${criterion}`;
  const { asc, desc, sort_toggle } = useFiltersStore(
    useShallow((s) => ({
      asc: s.active_set.has(to_filter_key(key, "ASC")),
      desc: s.active_set.has(to_filter_key(key, "DESC")),
      sort_toggle: s.sort_toggle,
    })),
  );
  const toggle = useCallback((direction: SortDirection) => sort_toggle([key, direction]), [sort_toggle, key]);
  return { direction: asc ? ("ASC" as const) : desc ? ("DESC" as const) : null, toggle };
}

function useRangeFilter(filter: string) {
  const { value, range_set, range_clear } = useFiltersStore(
    useShallow((s) => ({ value: s.active_ranges[filter] ?? null, range_set: s.range_set, range_clear: s.range_clear })),
  );
  const set = useCallback((next: [number, number]) => range_set(filter, next), [range_set, filter]);
  const clear = useCallback(() => range_clear(filter), [range_clear, filter]);
  return { value, set, clear };
}

const HOOKS: ListingHooks = { useFilters, useAppliedFilters, useFilterOption, useSortCriterion, useRangeFilter };

// The listing's model for the theme's template (@theme/catalog/listing-page): the products of a category or a
// search, the pages, the filters' hooks. `options`: null when there is no list to ask for (a short search phrase).
export function ListingPageRuntime({
  kind,
  options,
  header,
  hint = null,
  category_name,
  children,
}: {
  kind: ListingPageModel["kind"];
  options: ListingOptions | null;
  header: ListingPageModel["header"];
  hint?: string | null;
  category_name?: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const search_params = useSearchParams();
  const api = useMemo(() => create_api(make_client_access()), []);
  const list_ref = useRef<HTMLDivElement>(null);
  const [pending, start_transition] = useTransition();

  const { data, isLoading, isError, error } = useQuery({
    ...catalog_query(api, options ?? NO_LIST),
    enabled: !!options,
    refetchOnWindowFocus: true,
  });

  const page = Number(options?.page ?? 1);
  const go = (to: number) => {
    const params = new URLSearchParams(search_params.toString());
    params.set("page", String(to));
    start_transition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
      // Both bars page the same list: always land at its top, whichever bar was used.
      list_ref.current?.scrollIntoView({ block: "start" });
    });
  };

  // An empty result under filters is not an empty category.
  const filtered = Object.keys(options ?? {}).some((key) => /^[qr]_/.test(key));

  const model: ListingPageModel = {
    kind,
    header,
    hint,
    status: isLoading ? "loading" : isError ? "error" : "ready",
    error: isError ? ((error as Error)?.message ?? "") : null,
    products: data?.data ?? [],
    filtered,
    pagination: { page, has_prev: page > 1, has_next: data?.pagination?.has_next_page ?? false, go, pending },
    list_ref,
    blocks: {
      notify_similar:
        kind === "category" && !filtered ? (
          <NotifySimilar
            body={{ category: category_name }}
            trigger_label={t("catalog.notify_cta")}
            title_key="notify.title_category"
            className="max-w-md text-foreground"
          />
        ) : null,
    },
  };

  return (
    <OptionsContext value={options}>
      <ListingPageProvider value={model} hooks={HOOKS}>
        {children}
      </ListingPageProvider>
    </OptionsContext>
  );
}
