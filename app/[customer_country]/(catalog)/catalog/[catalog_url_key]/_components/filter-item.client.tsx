"use client";

import { memo, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { useFiltersStore, to_filter_key } from "./filters.store";

type FilterItemProps = {
  prefix_filter_idx: string;
  option: { idx: string; label: string };
  toggle_type?: "multi" | "sort";
};

const FilterItem = memo(function FilterItem({
  prefix_filter_idx,
  option,
  toggle_type = "multi",
}: FilterItemProps) {
  // Single subscription instead of 3 — 3x fewer selector calls per store update.
  // useShallow prevents rerender when returned object values are reference-equal.
  const { is_active, toggle, sort_toggle } = useFiltersStore(
    useShallow((s) => ({
      is_active: s.active_set.has(to_filter_key(prefix_filter_idx, option.idx)),
      toggle: s.toggle,
      sort_toggle: s.sort_toggle,
    })),
  );

  const handle_click = useCallback(() => {
    const filter: [string, string] = [prefix_filter_idx, option.idx];
    if (toggle_type === "sort") sort_toggle(filter);
    else toggle(filter);
  }, [toggle, sort_toggle, toggle_type, prefix_filter_idx, option.idx]);

  return (
    <Button
      variant={is_active ? "default" : "outline"}
      size="xs"
      className="w-full justify-start cursor-pointer"
      onClick={handle_click}
    >
      <p>{option.label}</p>
    </Button>
  );
});

export { FilterItem };
