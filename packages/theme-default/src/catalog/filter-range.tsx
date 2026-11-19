// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { memo, useState } from "react";
import { X } from "lucide-react";
import { useRangeFilter, type RangeFilter } from "@entirius/storefront-sdk/catalog/listing";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";
import { Slider } from "@theme/ui/slider";

// A filter by range: a two-handle slider with the chosen bounds under it, and a reset once changed.
export const FilterRange = memo(function FilterRange({ filter }: { filter: RangeFilter }) {
  const { t } = useI18n();
  const { idx, label, min, max } = filter;
  const range = useRangeFilter(idx);

  // The slider keeps its own value while dragged and follows the chosen one (apply, reset, clear all) and the range;
  // the follow happens during render, not in an effect (no extra paint with the old value).
  const target: [number, number] = range.value ?? [min, max];
  const [local, set_local] = useState<[number, number]>(target);
  const [followed, set_followed] = useState<[number, number]>(target);
  if (target[0] !== followed[0] || target[1] !== followed[1]) {
    set_followed(target);
    set_local(target);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base">{label}</h3>
        <div className="flex items-center gap-2">
          {range.value !== null && (
            <Button
              variant="ghost"
              size="xs"
              aria-label={t("catalog.reset_filter", { label })}
              className="relative h-6 touch-target px-1.5 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => {
                range.clear();
                set_local([min, max]);
              }}
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
        value={local}
        onValueChange={(values) => set_local([values[0], values[1]])}
        onValueCommit={(values) => range.set([values[0], values[1]])}
      />
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm tabular-nums">
        <span className="rounded-xl border border-border px-3 py-2">
          <span className="block text-xs text-muted-foreground">{t("catalog.range_from")}</span>
          {local[0]}
        </span>
        <span className="rounded-xl border border-border px-3 py-2">
          <span className="block text-xs text-muted-foreground">{t("catalog.range_to")}</span>
          {local[1]}
        </span>
      </div>
    </div>
  );
});
