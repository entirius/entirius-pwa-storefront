import { create } from "zustand";
import { ACTIVE_FILTER } from "./components.d";

// Shared key format for Set lookups
export const to_filter_key = (p: string, idx: string) => `${p}::${idx}`;

const is_same = (a: ACTIVE_FILTER, b: ACTIVE_FILTER) =>
  a[0] === b[0] && a[1] === b[1];

// ------------------------------------------------------------

type FiltersStore = {
  active_filters: ACTIVE_FILTER[];
  active_ranges: Record<string, [number, number]>;
  // Derived Set kept in sync for O(1) is_active lookups in FilterItem
  active_set: Set<string>;

  // Actions
  toggle: (filter: ACTIVE_FILTER) => void;
  sort_toggle: (filter: ACTIVE_FILTER) => void;
  range_set: (filter_idx: string, value: [number, number]) => void;
  range_clear: (filter_idx: string) => void;
  init: (search_params: URLSearchParams) => void;
  clear: () => void;
};

// ------------------------------------------------------------

export const useFiltersStore = create<FiltersStore>()((set) => ({
  active_filters: [],
  active_ranges: {},
  active_set: new Set(),

  toggle: (filter) =>
    set((s) => {
      const exists = s.active_set.has(to_filter_key(filter[0], filter[1]));
      const next = exists
        ? s.active_filters.filter((f) => !is_same(f, filter))
        : [...s.active_filters, filter];
      return { active_filters: next, active_set: new Set(next.map(([p, i]) => to_filter_key(p, i))) };
    }),

  // Sort is single-criterion: selecting any ASC/DESC clears ALL s_* filters first.
  // Clicking the already-active direction deselects it.
  sort_toggle: (filter) =>
    set((s) => {
      const exists = s.active_set.has(to_filter_key(filter[0], filter[1]));
      const without_sort = s.active_filters.filter((f) => !f[0].startsWith("s_"));
      const next = exists ? without_sort : [...without_sort, filter];
      return { active_filters: next, active_set: new Set(next.map(([p, i]) => to_filter_key(p, i))) };
    }),

  range_set: (filter_idx, value) =>
    set((s) => ({ active_ranges: { ...s.active_ranges, [filter_idx]: value } })),

  range_clear: (filter_idx) =>
    set((s) => {
      const { [filter_idx]: _, ...rest } = s.active_ranges;
      return { active_ranges: rest };
    }),

  init: (search_params) => {
    const filters: ACTIVE_FILTER[] = [];
    search_params.forEach((value, key) => {
      if (["q_", "s_"].some((p) => key.startsWith(p))) {
        filters.push([key, value]);
      }
    });

    const ranges: Record<string, [number, number]> = {};
    const range_keys = new Set<string>();
    search_params.forEach((_, key) => {
      if (key.startsWith("r_")) range_keys.add(key);
    });
    range_keys.forEach((key) => {
      const values = search_params.getAll(key);
      if (values.length >= 2) {
        ranges[key] = [parseFloat(values[0]), parseFloat(values[1])];
      }
    });

    set({
      active_filters: filters,
      active_ranges: ranges,
      active_set: new Set(filters.map(([p, i]) => to_filter_key(p, i))),
    });
  },

  clear: () => set({ active_filters: [], active_ranges: {}, active_set: new Set() }),
}));
