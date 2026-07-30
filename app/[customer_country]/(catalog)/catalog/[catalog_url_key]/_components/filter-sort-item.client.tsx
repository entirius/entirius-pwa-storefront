"use client";

import { memo, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-sm font-medium">{label}</span>
      <Button
        variant={is_asc ? "default" : "outline"}
        size="xs"
        onClick={toggle_asc}
      >
        ASC ↑
      </Button>
      <Button
        variant={is_desc ? "default" : "outline"}
        size="xs"
        onClick={toggle_desc}
      >
        DESC ↓
      </Button>
    </div>
  );
});

export { FilterSortItem };
