// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Search } from "lucide-react";
import { useHeaderSearch } from "@entirius/storefront-sdk/storefront";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@theme/ui/input-group";
import { Spinner } from "@theme/ui/spinner";
import { SearchResults } from "@theme/layout/search-results";

// The 404 page's search: the header's search inline, so a dead link does not end the visit. Enter opens every
// result of the phrase.
export function NotFoundSearch() {
  const { t } = useI18n();
  const { q, setQ, debounced, enabled, data, isFetching, onSubmit } = useHeaderSearch();
  return (
    <div data-notfound-search className="mx-auto w-full max-w-md text-left">
      <form role="search" onSubmit={onSubmit}>
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>
              <Search />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            enterKeyHint="search"
            aria-label={t("header.search")}
            placeholder={t("search.placeholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {isFetching && enabled && (
            <InputGroupAddon align="inline-end">
              <Spinner className="size-4" />
            </InputGroupAddon>
          )}
        </InputGroup>
      </form>
      {enabled && data && (
        <div className="mt-4">
          <SearchResults data={data} query={debounced} onNavigate={() => setQ("")} onPhrase={setQ} />
        </div>
      )}
    </div>
  );
}
