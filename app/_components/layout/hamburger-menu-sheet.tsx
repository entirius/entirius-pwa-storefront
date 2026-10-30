// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { categories_query } from "./api.query";
import { HEADER_ICON } from "./header-icon";
import { type CATEGORY, type CONFIG_QUERY } from "./menu-config";
import { LinkDynamic } from "@/lib/link-dynamic";
import { cn } from "@/lib/utils";
import { NORM_CATEGORY_BRANCH } from "@/utils/NORMALIZERS/category.normalizer";
import { useI18n } from "@/providers/i18n.provider";

type Level = { url_key: string | null; name: string };

// `footer` is rendered under the list (the language and currency switch on small screens).
export function HamburgerMenuSheet({
  query,
  footer,
}: {
  query: CONFIG_QUERY;
  footer?: React.ReactNode;
}) {
  const { t } = useI18n();
  const api = useMemo(() => create_api(make_client_access()), []);

  // Drill-down stack — root level has a null url_key (fetches the configured roots).
  const root_level: Level = { url_key: null, name: t("header.menu") };
  const [stack, setStack] = useState<Level[]>([root_level]);
  const current = stack[stack.length - 1];

  // Root uses the shared CONFIG_QUERY; deeper levels lazily list children by parent.
  const queryOptions =
    current.url_key === null ? query : { parent_url_key: current.url_key };

  // Each level is fetched lazily and cached by its own query key.
  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...categories_query(api, queryOptions),
    refetchOnWindowFocus: false,
  });

  const goDeeper = (category: CATEGORY) =>
    setStack((prev) => [
      ...prev,
      { url_key: category.url_key, name: category.name },
    ]);

  const goBack = () => setStack((prev) => prev.slice(0, -1));

  // Scoping happens server-side via CONFIG_QUERY; render rows as returned. Inside a category its own row
  // comes first: a row with children only leads deeper, so this is the way to the collective category.
  const rows: CATEGORY[] = response?.data ?? [];
  const { url_key, name } = current;
  const items = url_key === null ? rows : NORM_CATEGORY_BRANCH({ url_key, name }, rows);

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
              {t("common.error", { message: (error as Error)?.message })}
            </span>
          )}
          {!isLoading && !isError && items.length === 0 && (
            <p className="px-4 text-sm text-muted-foreground">{t("common.no_data")}</p>
          )}
          {items.map((category: CATEGORY) =>
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
                <LinkDynamic
                  href={`/catalog/${category.url_key}`}
                  className={cn(
                    "w-full block text-sm px-4 py-2 hover:bg-accent hover:text-accent-foreground",
                    category.is_self ? "font-medium text-link" : "text-foreground",
                  )}
                >
                  {category.is_self ? t("menu.view_all", { name: category.name }) : category.name}
                </LinkDynamic>
              </SheetClose>
            ),
          )}
        </div>
        {footer}
      </SheetContent>
    </Sheet>
  );
}
