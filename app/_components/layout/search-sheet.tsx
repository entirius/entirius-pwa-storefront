// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SearchBody, SearchField, useHeaderSearch } from "./header-search.client";
import { HEADER_ICON } from "./header-icon";
import { useI18n } from "@/providers/i18n.provider";

// The phone's search: an icon that opens a sheet from the top. From md up the header has the search bar.
export function SearchSheet() {
  const { t } = useI18n();
  const search = useHeaderSearch();

  return (
    <Sheet open={search.open} onOpenChange={search.onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("header.search")}
          className="cursor-pointer text-foreground md:hidden"
        >
          <Search className={HEADER_ICON} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="top"
        aria-describedby={undefined}
        showCloseButton={false}
        className="max-h-[85vh] gap-0 overflow-y-auto"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle className="sr-only">{t("search.title")}</SheetTitle>
          <SearchField search={search} />
        </SheetHeader>
        <SearchBody search={search} />
      </SheetContent>
    </Sheet>
  );
}
