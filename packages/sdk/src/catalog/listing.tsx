// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { createContext, useContext, type ReactNode, type RefObject } from "react";
import type { Crumb } from "../layout/types";
import type { ProductCardData } from "../product/card";

export type FilterOption = { idx: string; label: string; count: number | null };
// A filter by values ("q_color"): any number of its options at once. `count` 0: no product in the list has it.
export type ValueFilter = { idx: string; label: string; options: FilterOption[] };
// A filter by range ("r_price"), between the lowest and the highest value in the list.
export type RangeFilter = { idx: string; label: string; min: number; max: number };
// A sort criterion ("name"), ascending or descending; one criterion at a time.
export type SortCriterion = { idx: string; label: string };
export type SortDirection = "ASC" | "DESC";

// A product list: a category's products or the results of a search, worked out by the core (the query, the filters
// in the URL, the pages). Each part of the listing template reads what it needs from here.
export type ListingPageModel = {
  kind: "category" | "search";
  // null: a category the API does not describe (the list still shows).
  header: {
    title: string;
    trail: Crumb[];
    // The category's description (HTML from the API, for <RichText>); null without one.
    description_html: string | null;
    // Long enough to need "Show more" from the first paint.
    description_long: boolean;
    subcategories: { name: string; href: string }[];
  } | null;
  // Instead of the list (a search phrase below the minimum length); null otherwise.
  hint: string | null;
  status: "loading" | "error" | "ready";
  // The error's message for "common.error"; null without one.
  error: string | null;
  products: ProductCardData[];
  // Filters from the URL narrow the list: an empty result is then not an empty category.
  filtered: boolean;
  pagination: {
    page: number;
    has_prev: boolean;
    has_next: boolean;
    go: (page: number) => void;
    // A page change is on its way.
    pending: boolean;
  };
  // The list's container: a page change scrolls back to its top.
  list_ref: RefObject<HTMLDivElement | null>;
  // Forms the core renders whole: "tell me when there are products" for an empty, unfiltered category, else null.
  blocks: { notify_similar: ReactNode };
};

// The filter panel: what the list can be narrowed and sorted by, and the choices made but not applied yet.
export type ListingFilters = {
  status: "loading" | "error" | "ready";
  // New counts are on their way.
  updating: boolean;
  sort: SortCriterion[];
  ranges: RangeFilter[];
  filters: ValueFilter[];
  // Filters are in the URL now.
  applied: boolean;
  // Choices made in the panel (values, ranges, the sort), applied or not.
  chosen: number;
  apply: () => void;
  clear: () => void;
};

// Where the panel is: the desktop column stays mounted and drops the choices when it goes; the phone sheet mounts
// on every open and keeps them.
export type FiltersPlace = "sidebar" | "sheet";

// The core lends these per listing; each one follows only its own piece of the panel's state.
export type ListingHooks = {
  useFilters: (place: FiltersPlace) => ListingFilters;
  useAppliedFilters: () => { applied: boolean; discard_choices: () => void };
  useFilterOption: (filter: string, option: string) => { checked: boolean; toggle: () => void };
  useSortCriterion: (criterion: string) => { direction: SortDirection | null; toggle: (direction: SortDirection) => void };
  useRangeFilter: (filter: string) => {
    value: [number, number] | null;
    set: (value: [number, number]) => void;
    clear: () => void;
  };
};

const ListingPageContext = createContext<ListingPageModel | null>(null);
const ListingHooksContext = createContext<ListingHooks | null>(null);

export function ListingPageProvider({
  value,
  hooks,
  children,
}: {
  value: ListingPageModel;
  hooks: ListingHooks;
  children: ReactNode;
}) {
  return (
    <ListingHooksContext value={hooks}>
      <ListingPageContext value={value}>{children}</ListingPageContext>
    </ListingHooksContext>
  );
}

export function useListingPage(): ListingPageModel {
  const page = useContext(ListingPageContext);
  if (!page) throw new Error("useListingPage must be used within <ListingPageProvider>");
  return page;
}

function useListingHooks(): ListingHooks {
  const hooks = useContext(ListingHooksContext);
  if (!hooks) throw new Error("listing hooks must be used within <ListingPageProvider>");
  return hooks;
}

// The panel's groups and its Apply / Clear; mount it once per place.
export const useListingFilters = (place: FiltersPlace) => useListingHooks().useFilters(place);
// Whether filters are in the URL (the phone trigger's dot), and dropping the choices of a sheet closed without Apply.
export const useAppliedFilters = () => useListingHooks().useAppliedFilters();
export const useFilterOption = (filter: string, option: string) => useListingHooks().useFilterOption(filter, option);
export const useSortCriterion = (criterion: string) => useListingHooks().useSortCriterion(criterion);
export const useRangeFilter = (filter: string) => useListingHooks().useRangeFilter(filter);
