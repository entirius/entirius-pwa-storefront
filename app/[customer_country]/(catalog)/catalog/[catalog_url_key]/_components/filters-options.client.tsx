"use client";

import { memo, useCallback, useLayoutEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { filters_query } from "../api.query";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { FilterItem } from "./filter-item.client";
import { FilterSortItem } from "./filter-sort-item.client";
import { FilterRange } from "./filter-range.client";
import { useFiltersStore } from "./filters.store";

const FILTER_PREFIXES = ["q_", "s_", "r_"];

// ------------------------------------------------------------

const FilterGroup = memo(function FilterGroup({
  prefix_filter_idx,
  filter,
}: {
  prefix_filter_idx: string;
  filter: any;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{filter.label}</h3>
      <div className="flex flex-col gap-2 mt-2">
        {filter.options?.map((option: any) => (
          <FilterItem
            key={option.idx}
            prefix_filter_idx={prefix_filter_idx}
            option={option}
          />
        ))}
      </div>
    </div>
  );
});

// Sort group renders ASC/DESC buttons per option, not toggles.
// Key format: s_<option_idx> (e.g. s_name=ASC → sort: { name: ["ASC"] })
const SortGroup = memo(function SortGroup({
  filter,
}: {
  filter: any;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{filter.label}</h3>
      <div className="flex flex-col gap-2 mt-2">
        {filter.options?.map((option: any) => (
          <FilterSortItem
            key={option.idx}
            option_idx={option.idx}
            label={option.label}
          />
        ))}
      </div>
    </div>
  );
});

// ------------------------------------------------------------

export function FiltersOptionsClient({ options }: { options: any }) {
  const router = useRouter();
  const search_params = useSearchParams();

  const api = useMemo(() => create_api(make_client_access()), []);

  // useLayoutEffect — runs before browser paint, prevents flash of unselected state
  const init = useFiltersStore((s) => s.init);
  const clear = useFiltersStore((s) => s.clear);
  useLayoutEffect(() => {
    init(search_params);
    return () => clear();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe only to counts needed for Apply button
  const active_filters_count = useFiltersStore((s) => s.active_filters.length);
  const active_ranges_count = useFiltersStore(
    (s) => Object.keys(s.active_ranges).length,
  );
  const has_pending = active_filters_count > 0 || active_ranges_count > 0;

  const handle_apply = useCallback(() => {
    // Read store state imperatively — no subscription needed in event handler
    const { active_filters, active_ranges } = useFiltersStore.getState();
    const params = new URLSearchParams(search_params.toString());

    Array.from(params.keys())
      .filter((k) => FILTER_PREFIXES.some((p) => k.startsWith(p)))
      .forEach((k) => params.delete(k));

    active_filters.forEach(([filter_idx, option_idx]) => {
      params.append(filter_idx, option_idx);
    });

    Object.entries(active_ranges).forEach(([key, [min, max]]) => {
      params.append(key, String(min));
      params.append(key, String(max));
    });

    router.push(`?${params.toString()}`);
  }, [router, search_params]);

  const query_options = useMemo(
    () => ({ ...filters_query(api, options), refetchOnWindowFocus: false }),
    [api, options],
  );

  const { data: response, isLoading, isFetching, isError } = useQuery(query_options);

  if (isLoading) return <Spinner className="size-6 mx-auto mt-4" />;
  if (!response || isError)
    return <p className="text-sm text-destructive p-4">Failed to load filters</p>;

  const { q_, s_, r_ } = response.data ?? {};

  const has_sort = s_ && Object.keys(s_).length;
  const has_range = r_ && Object.keys(r_).length;
  const has_query = q_ && Object.keys(q_).length;

  if (!has_sort && !has_range && !has_query) return null;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      {isFetching && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner className="size-3" />
          <span>Updating…</span>
        </div>
      )}
      {has_sort && (
        <div className="flex flex-col gap-3">
          {Object.entries(s_).map(([prefix_filter_idx, filter]: any) => (
            <SortGroup
              key={prefix_filter_idx}
              filter={filter}
            />
          ))}
          <hr className="border-border" />
        </div>
      )}

      {has_range && (
        <div className="flex flex-col gap-5">
          {Object.entries(r_).map(([filter_idx, filter]: any) => (
            <FilterRange
              key={filter_idx}
              filter_idx={filter_idx}
              label={filter.label}
              min={Math.floor(parseFloat(filter.min_value))}
              max={Math.ceil(parseFloat(filter.max_value))}
            />
          ))}
          <hr className="border-border" />
        </div>
      )}

      {has_query &&
        Object.entries(q_).map(([prefix_filter_idx, filter]: any) => (
          <FilterGroup
            key={prefix_filter_idx}
            prefix_filter_idx={prefix_filter_idx}
            filter={filter}
          />
        ))}

      <Button
        className="w-full mt-2 sticky bottom-4"
        disabled={!has_pending}
        onClick={handle_apply}
      >
        Apply ({active_filters_count + active_ranges_count})
      </Button>
    </div>
  );
}
