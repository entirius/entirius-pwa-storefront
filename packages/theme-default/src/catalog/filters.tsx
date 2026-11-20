// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useListingFilters, type FiltersPlace } from "@entirius/storefront-sdk/catalog/listing";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { cn } from "@theme/lib/utils";
import { Button } from "@theme/ui/button";
import { Spinner } from "@theme/ui/spinner";
import { SortOptions } from "@theme/catalog/sort-options";
import { FilterRange } from "@theme/catalog/filter-range";
import { FilterOptions } from "@theme/catalog/filter-options";

// The filter panel: sorting, ranges, value filters, then Apply. `place`: the desktop column or the phone sheet (the
// sheet's dialog title names the panel, so its visible line is not a second heading); `on_apply` closes the sheet.
export function ListingFilters({ place, on_apply }: { place: FiltersPlace; on_apply?: () => void }) {
  const { t } = useI18n();
  const filters = useListingFilters(place);
  const in_sheet = place === "sheet";

  if (filters.status === "loading") return <Spinner className="mx-auto mt-4 size-6" />;
  if (filters.status === "error") return <p className="p-4 text-sm text-destructive">{t("catalog.filters_failed")}</p>;
  if (!filters.sort.length && !filters.ranges.length && !filters.filters.length) return null;

  return (
    <div className="flex flex-col gap-5">
      <div data-filters-header className={cn("flex items-center justify-between gap-2", in_sheet && "flex-wrap pr-8")}>
        {in_sheet ? (
          <p data-filters-heading aria-hidden className="font-brand text-xl text-heading">
            {t("catalog.filters")}
          </p>
        ) : (
          <h2 data-filters-heading className="text-xl">
            {t("catalog.filters")}
          </h2>
        )}
        {(filters.applied || filters.chosen > 0) && (
          <Button variant="link" size="sm" className="h-auto px-0" onClick={filters.clear}>
            {t("catalog.clear_all")}
          </Button>
        )}
      </div>
      {filters.updating && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner className="size-3" />
          <span>{t("catalog.updating")}</span>
        </div>
      )}
      {filters.sort.length > 0 && <SortOptions criteria={filters.sort} />}
      {filters.ranges.length > 0 && (
        <div className="flex flex-col gap-5 border-t border-border pt-4">
          {filters.ranges.map((range) => (
            <FilterRange key={range.idx} filter={range} />
          ))}
        </div>
      )}
      {filters.filters.map((filter) => (
        <FilterOptions key={filter.idx} filter={filter} />
      ))}
      <div className="sticky bottom-0 bg-card pt-3 pb-1">
        <Button
          className="w-full"
          size="lg"
          disabled={filters.chosen === 0}
          onClick={() => {
            filters.apply();
            on_apply?.();
          }}
        >
          {t("catalog.apply", { count: filters.chosen })}
        </Button>
      </div>
    </div>
  );
}
