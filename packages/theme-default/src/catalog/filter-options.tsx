// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { memo, useId } from "react";
import { useFilterOption, type FilterOption, type ValueFilter } from "@entirius/storefront-sdk/catalog/listing";
import { Checkbox } from "@theme/ui/checkbox";

// One option: follows only its own checkbox, so a click does not re-render the panel.
const FilterOptionRow = memo(function FilterOptionRow({ filter, option }: { filter: string; option: FilterOption }) {
  const { checked, toggle } = useFilterOption(filter, option.idx);
  // A value no product in this listing has stays visible but cannot be picked (unless it is already on).
  const empty = option.count === 0 && !checked;
  // The panel can render twice (desktop column + phone sheet): ids must be unique.
  const id = useId();

  return (
    <label
      htmlFor={id}
      className="flex min-h-9 pointer-coarse:min-h-touch cursor-pointer items-center gap-3 rounded-xl px-2 text-sm text-heading transition-colors hover:bg-muted has-disabled:cursor-not-allowed has-disabled:text-muted-foreground has-disabled:hover:bg-transparent"
    >
      <Checkbox id={id} checked={checked} disabled={empty} onCheckedChange={toggle} />
      <span className="flex-1">{option.label}</span>
      {typeof option.count === "number" && (
        <span className="text-xs tabular-nums text-muted-foreground">{option.count}</span>
      )}
    </label>
  );
});

// A filter by values: its name and a checkbox per option, with the number of products that have it.
export const FilterOptions = memo(function FilterOptions({ filter }: { filter: ValueFilter }) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <h3 className="text-base">{filter.label}</h3>
      <div className="-mx-2 flex flex-col">
        {filter.options.map((option) => (
          <FilterOptionRow key={option.idx} filter={filter.idx} option={option} />
        ))}
      </div>
    </div>
  );
});
