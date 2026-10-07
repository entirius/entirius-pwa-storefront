// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { memo, useCallback, useId } from "react";
import { useShallow } from "zustand/react/shallow";
import { Checkbox } from "@/components/ui/checkbox";
import { useFiltersStore, to_filter_key } from "./filters.store";

type FilterItemProps = {
  prefix_filter_idx: string;
  option: { idx: string; label: string; count?: number | null };
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

  // A value no product in this listing has stays visible but cannot be picked
  // (unless it is already on).
  const empty = option.count === 0 && !is_active;
  // The panel can render twice (desktop sidebar + phone sheet): ids must be unique.
  const id = useId();

  return (
    <label
      htmlFor={id}
      className="flex min-h-9 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm text-heading transition-colors hover:bg-muted has-disabled:cursor-not-allowed has-disabled:text-muted-foreground has-disabled:hover:bg-transparent"
    >
      <Checkbox id={id} checked={is_active} disabled={empty} onCheckedChange={handle_click} />
      <span className="flex-1">{option.label}</span>
      {typeof option.count === "number" && (
        <span className="text-xs tabular-nums text-muted-foreground">{option.count}</span>
      )}
    </label>
  );
});

export { FilterItem };
