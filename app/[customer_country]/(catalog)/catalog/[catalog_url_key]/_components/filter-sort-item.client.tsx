// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { memo, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFiltersStore, to_filter_key } from "./filters.store";

type FilterSortItemProps = {
  option_idx: string;
  label: string;
};

// Builds URL key: s_<option_idx> (e.g. s_name, s_price)
// Value: "ASC" | "DESC"
// → URL: ?s_name=ASC  → page.tsx: sort: { name: ["ASC"] }

const FilterSortItem = memo(function FilterSortItem({
  option_idx,
  label,
}: FilterSortItemProps) {
  const sort_key = `s_${option_idx}`;

  const { is_asc, is_desc, sort_toggle } = useFiltersStore(
    useShallow((s) => ({
      is_asc: s.active_set.has(to_filter_key(sort_key, "ASC")),
      is_desc: s.active_set.has(to_filter_key(sort_key, "DESC")),
      sort_toggle: s.sort_toggle,
    })),
  );

  const toggle_asc = useCallback(
    () => sort_toggle([sort_key, "ASC"]),
    [sort_toggle, sort_key],
  );

  const toggle_desc = useCallback(
    () => sort_toggle([sort_key, "DESC"]),
    [sort_toggle, sort_key],
  );

  const pill = (active: boolean) =>
    cn(
      "inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-heading hover:bg-muted",
    );

  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-sm text-heading">{label}</span>
      <button
        type="button"
        aria-pressed={is_asc}
        aria-label={`${label}, ascending`}
        className={pill(is_asc)}
        onClick={toggle_asc}
      >
        <ArrowUp className="size-3.5" aria-hidden />
        Asc
      </button>
      <button
        type="button"
        aria-pressed={is_desc}
        aria-label={`${label}, descending`}
        className={pill(is_desc)}
        onClick={toggle_desc}
      >
        <ArrowDown className="size-3.5" aria-hidden />
        Desc
      </button>
    </div>
  );
});

export { FilterSortItem };
