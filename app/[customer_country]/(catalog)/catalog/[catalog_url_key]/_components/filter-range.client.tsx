"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useFiltersStore } from "./filters.store";

type FilterRangeProps = {
  filter_idx: string;
  label: string;
  min: number;
  max: number;
};

const FilterRange = memo(function FilterRange({
  filter_idx,
  label,
  min,
  max,
}: FilterRangeProps) {
  const { stored_value, range_set, range_clear } = useFiltersStore(
    useShallow((s) => ({
      stored_value: s.active_ranges[filter_idx] ?? null,
      range_set: s.range_set,
      range_clear: s.range_clear,
    })),
  );

  const [local_value, setLocalValue] = useState<[number, number]>(
    stored_value ?? [min, max],
  );

  useEffect(() => {
    setLocalValue(stored_value ?? [min, max]);
  }, [stored_value, min, max]);

  const handle_change = useCallback((vals: number[]) => {
    setLocalValue([vals[0], vals[1]]);
  }, []);

  const handle_commit = useCallback(
    (vals: number[]) => {
      range_set(filter_idx, [vals[0], vals[1]]);
    },
    [filter_idx, range_set],
  );

  const handle_reset = useCallback(() => {
    range_clear(filter_idx);
    setLocalValue([min, max]);
  }, [filter_idx, range_clear, min, max]);

  const is_modified = stored_value !== null;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">{label}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground tabular-nums">
            {local_value[0]} — {local_value[1]}
          </span>
          {is_modified && (
            <Button
              variant="ghost"
              size="xs"
              className="h-5 px-1.5 text-xs text-muted-foreground hover:text-destructive"
              onClick={handle_reset}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={local_value}
        onValueChange={handle_change}
        onValueCommit={handle_commit}
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
});

export { FilterRange };
