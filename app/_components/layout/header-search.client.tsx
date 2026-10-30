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
import { Spinner } from "@/components/ui/spinner";
import { SheetClose } from "@/components/ui/sheet";
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

// The header's search, shared by the phone's sheet and the desktop's bar: the state, the field and the results.
export function useHeaderSearch() {
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

  return { open, q, setQ, debounced, enabled, data, isFetching, isError, currency, onOpenChange, onSubmit };
}

type HeaderSearch = ReturnType<typeof useHeaderSearch>;

export function SearchField({ search }: { search: HeaderSearch }) {
  const { t } = useI18n();
  return (
    <form role="search" onSubmit={search.onSubmit}>
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
          value={search.q}
          onChange={(e) => search.setQ(e.target.value)}
        />
        <InputGroupAddon align="inline-end">
          {search.isFetching && search.enabled && <Spinner className="size-4" />}
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
  );
}

export function SearchBody({ search }: { search: HeaderSearch }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4">
      {!search.enabled ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("search.min_chars", { count: SEARCH_MIN_CHARS })}
        </p>
      ) : search.isError ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("search.error")}
        </p>
      ) : !search.data ? (
        <div className="flex justify-center py-6">
          <Spinner className="size-5" />
        </div>
      ) : (
        <SearchResults
          data={search.data}
          query={search.debounced}
          currency={search.currency}
          onNavigate={() => search.onOpenChange(false)}
          onPhrase={(text) => search.setQ(text)}
        />
      )}
    </div>
  );
}
