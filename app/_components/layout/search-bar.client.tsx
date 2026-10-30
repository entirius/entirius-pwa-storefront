// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Search } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/button";
import { Sheet, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { HEADER_ICON } from "./header-icon";
import { SearchBody, SearchField, useHeaderSearch } from "./header-search.client";
import { useI18n } from "@/providers/i18n.provider";

// The desktop's search: a magnifier that spreads into a field in the free space next to it. A non-modal dialog
// without a portal: it stays in the header, the page behind stays usable, and Radix handles Escape, a click outside
// and the focus. The results open right under the top row (anchored to the sticky header) and cover a menu row, so
// the pointer on its way to them crosses no menu trigger.
export function SearchBar() {
  const { t } = useI18n();
  const search = useHeaderSearch();

  return (
    <Sheet modal={false} open={search.open} onOpenChange={search.onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("header.search")}
          className={cn("hidden cursor-pointer text-foreground", !search.open && "md:inline-flex")}
        >
          <Search className={HEADER_ICON} />
        </Button>
      </SheetTrigger>
      <DialogPrimitive.Content aria-describedby={undefined} className="hidden md:block">
        <SheetTitle className="sr-only">{t("search.title")}</SheetTitle>
        <div className="w-40 starting:w-10 motion-safe:transition-[width] motion-safe:duration-200 lg:w-64 lg:starting:w-10 xl:w-72 xl:starting:w-10">
          <SearchField search={search} />
        </div>
        <div className="absolute inset-x-0 top-[var(--header-top)] z-raised max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain border-b border-border bg-popover text-popover-foreground shadow">
          <SearchBody search={search} />
        </div>
      </DialogPrimitive.Content>
    </Sheet>
  );
}
