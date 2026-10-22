// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useSearchParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FiltersOptionsClient } from "./filters-options.client";
import type { ListingOptions } from "../api.query";
import { FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/providers/i18n.provider";

const FILTER_PREFIXES = ["q_", "s_", "r_"];

export function FiltersTriggerClient({ options }: { options: ListingOptions }) {
  const search_params = useSearchParams();
  const { t } = useI18n();

  const has_active = FILTER_PREFIXES.some((p) =>
    Array.from(search_params.keys()).some((k) => k.startsWith(p)),
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <div className="relative">
            <FilterIcon className="size-4" />
            {has_active && (
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-highlight" />
            )}
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
          <FiltersOptionsClient options={options} in_sheet />
        </div>
      </SheetContent>
    </Sheet>
  );
}
