// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { SEARCH_MIN_CHARS, search_path, search_query } from "./search.query";
import { SearchResults } from "./search-results";
import { useI18n } from "@/providers/i18n.provider";
import { profile_path } from "@/lib/profile-path";

export function SearchSheet() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  const access = useMemo(() => make_client_access(), []);
  const api = useMemo(() => create_api(access), [access]);
  // The `cr` cookie holds the ISO code lowercase; prices display it uppercase.
  const currency = (access.get("cr") ?? "").toUpperCase();

  // Debounce the typed value (~300ms) before it drives the query.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const enabled = debounced.length >= SEARCH_MIN_CHARS;
  const { data, isFetching, isError } = useQuery({
    ...search_query(api, { q: debounced }),
    enabled,
    placeholderData: (prev) => prev,
  });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQ("");
      setDebounced("");
    }
  };

  // Enter: every result of the typed phrase on the results page.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const phrase = q.trim();
    if (phrase.length < SEARCH_MIN_CHARS) return;
    onOpenChange(false);
    router.push(profile_path(params?.customer_country as string | undefined, search_path(phrase)));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {/* An icon on phones, a search field look-alike from md up; it opens the
            search sheet either way. */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("header.search")}
          className="cursor-pointer text-foreground md:h-10 md:w-56 md:justify-start md:gap-2 md:rounded-control md:border md:border-border md:bg-background md:px-4 md:text-muted-foreground lg:w-72"
        >
          <Search />
          <span className="hidden text-sm font-normal md:inline">{t("search.trigger")}</span>
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
          <form role="search" onSubmit={onSubmit}>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <InputGroupText>
                  <Search />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                autoFocus
                enterKeyHint="search"
                placeholder={t("search.placeholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                {isFetching && enabled && <Spinner className="size-4" />}
                <SheetClose asChild>
                  <InputGroupButton
                    size="icon-sm"
                    aria-label={t("common.close")}
                    className="relative touch-target cursor-pointer"
                  >
                    <X />
                  </InputGroupButton>
                </SheetClose>
              </InputGroupAddon>
            </InputGroup>
          </form>
        </SheetHeader>

        <div className="mx-auto w-full max-w-2xl px-4 py-4">
          {!enabled ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("search.min_chars", { count: SEARCH_MIN_CHARS })}
            </p>
          ) : isError ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("search.error")}
            </p>
          ) : !data ? (
            <div className="flex justify-center py-6">
              <Spinner className="size-5" />
            </div>
          ) : (
            <SearchResults
              data={data}
              query={debounced}
              currency={currency}
              onNavigate={() => onOpenChange(false)}
              onPhrase={(text) => setQ(text)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
