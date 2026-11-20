// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";
import { Button } from "@theme/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@theme/ui/sheet";
import { Spinner } from "@theme/ui/spinner";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";

import { useState } from "react";
import { Link } from "@entirius/storefront-sdk/components/link";
import type { MenuCategory } from "@entirius/storefront-sdk/layout";
import { useMenuBranch } from "@entirius/storefront-sdk/storefront";
import { HEADER_ICON } from "@theme/layout/header-icon";
import { cn } from "@theme/lib/utils";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

type Level = { url_key: string | null; name: string };

// `footer` is rendered under the list (the language and currency switch on small screens).
export function HamburgerMenu({ footer }: { footer?: React.ReactNode }) {
  const { t } = useI18n();

  // Drill-down stack — root level has a null url_key (fetches the configured roots).
  const root_level: Level = { url_key: null, name: t("header.menu") };
  const [stack, setStack] = useState<Level[]>([root_level]);
  const current = stack[stack.length - 1];

  // The configured roots, then each level's children (its own row first), loaded and cached per level.
  const { url_key, name } = current;
  const { categories: items, loading: isLoading, error } = useMenuBranch(url_key === null ? null : { url_key, name });
  const isError = error !== null;

  const goDeeper = (category: MenuCategory) =>
    setStack((prev) => [
      ...prev,
      { url_key: category.url_key, name: category.name },
    ]);

  const goBack = () => setStack((prev) => prev.slice(0, -1));

  // Reset to root whenever the sheet is closed so it reopens at the top level.
  const onOpenChange = (open: boolean) => {
    if (!open) setStack([root_level]);
  };

  return (
    <Sheet onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("header.menu")}
          className="relative cursor-pointer text-foreground"
        >
          <Menu className={HEADER_ICON} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" aria-describedby={undefined}>
        <SheetHeader>
          {stack.length > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="relative flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground touch-target"
            >
              <ChevronLeft className="size-4" />
              {t("common.back")}
            </button>
          ) : null}
          <SheetTitle>{current.name}</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-1 gap-2">
          {isLoading && <Spinner className="size-4 mx-4" />}
          {isError && (
            <span className="px-4 text-sm text-destructive">
              {t("common.error", { message: error })}
            </span>
          )}
          {!isLoading && !isError && items.length === 0 && (
            <p className="px-4 text-sm text-muted-foreground">{t("common.no_data")}</p>
          )}
          {items.map((category) =>
            category.has_children ? (
              <button
                type="button"
                key={category.id ?? category.url_key}
                onClick={() => goDeeper(category)}
                className="w-full flex items-center justify-between text-sm text-foreground px-4 py-2 hover:bg-accent hover:text-accent-foreground"
              >
                <span>{category.name}</span>
                <ChevronRight className="size-4" />
              </button>
            ) : (
              <SheetClose asChild key={category.id ?? category.url_key}>
                <Link
                  href={`/catalog/${category.url_key}`}
                  className={cn(
                    "w-full block text-sm px-4 py-2 hover:bg-accent hover:text-accent-foreground",
                    category.is_self ? "font-medium text-link" : "text-foreground",
                  )}
                >
                  {category.is_self ? t("menu.view_all", { name: category.name }) : category.name}
                </Link>
              </SheetClose>
            ),
          )}
        </div>
        {footer}
      </SheetContent>
    </Sheet>
  );
}
