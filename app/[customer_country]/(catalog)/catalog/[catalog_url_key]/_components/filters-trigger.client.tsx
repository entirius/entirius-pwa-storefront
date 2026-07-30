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
import { FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const FILTER_PREFIXES = ["q_", "s_", "r_"];

export function FiltersTriggerClient({ options }: { options: any }) {
  const search_params = useSearchParams();

  const has_active = FILTER_PREFIXES.some((p) =>
    Array.from(search_params.keys()).some((k) => k.startsWith(p)),
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <div className="relative">
            <FilterIcon className="size-4" />
            {has_active && (
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500" />
            )}
          </div>
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow down the results</SheetDescription>
        </SheetHeader>
        <FiltersOptionsClient options={options} />
      </SheetContent>
    </Sheet>
  );
}
