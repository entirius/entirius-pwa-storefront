// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useState } from "react";
import { FilterIcon } from "lucide-react";
import { useAppliedFilters } from "@entirius/storefront-sdk/catalog/listing";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@theme/ui/sheet";
import { ListingFilters } from "@theme/catalog/filters";

// Phones: the filters in a sheet, behind a button with a dot while filters are applied.
export function FiltersSheet() {
  const { t } = useI18n();
  const { applied, discard_choices } = useAppliedFilters();
  const [open, set_open] = useState(false);

  // Closing without Apply drops the pending choices.
  const on_open_change = (next: boolean) => {
    set_open(next);
    if (!next) discard_choices();
  };

  return (
    <Sheet open={open} onOpenChange={on_open_change}>
      <SheetTrigger asChild>
        <Button data-filters-trigger variant="outline" size="sm" className="lg:hidden">
          <div className="relative">
            <FilterIcon className="size-4" />
            {applied && <span className="absolute -top-1 -right-1 size-2 rounded-full bg-highlight" />}
          </div>
          {t("catalog.filters")}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto bg-card">
        {/* The panel carries its own visible "Filters" heading. */}
        <SheetHeader className="sr-only">
          <SheetTitle>{t("catalog.filters")}</SheetTitle>
          <SheetDescription>{t("catalog.filters_hint")}</SheetDescription>
        </SheetHeader>
        <div className="p-4">
          <ListingFilters place="sheet" on_apply={() => set_open(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
