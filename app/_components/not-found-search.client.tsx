// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { Spinner } from "@/components/ui/spinner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { search_query } from "@/app/_components/layout/search.query";
import { SearchResults } from "@/app/_components/layout/search-results";
import { useI18n } from "@/providers/i18n.provider";

const MIN_CHARS = 2;

// Search field of the 404 page: the header's search, inline, so a dead link does not end the visit.
export function NotFoundSearch() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const access = useMemo(() => make_client_access(), []);
  const api = useMemo(() => create_api(access), [access]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const enabled = debounced.length >= MIN_CHARS;
  const { data, isFetching } = useQuery({ ...search_query(api, { q: debounced }), enabled });

  return (
    <div data-notfound-search className="mx-auto w-full max-w-md text-left">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>
            <Search />
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          type="search"
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
      {enabled && data && (
        <div className="mt-4">
          <SearchResults
            data={data}
            currency={(access.get("cr") ?? "").toUpperCase()}
            onNavigate={() => setQ("")}
            onPhrase={setQ}
          />
        </div>
      )}
    </div>
  );
}
