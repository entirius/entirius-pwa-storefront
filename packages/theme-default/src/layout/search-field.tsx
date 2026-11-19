// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Search, X } from "lucide-react";
import type { HeaderSearch } from "@entirius/storefront-sdk/layout";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Spinner } from "@theme/ui/spinner";
import { SheetClose } from "@theme/ui/sheet";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@theme/ui/input-group";
import { SearchResults } from "@theme/layout/search-results";

// The header's search box and what it found, shared by the desktop bar and the phone sheet.
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
          {t("search.min_chars", { count: search.min_chars })}
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
          onNavigate={() => search.onOpenChange(false)}
          onPhrase={(text) => search.setQ(text)}
        />
      )}
    </div>
  );
}
