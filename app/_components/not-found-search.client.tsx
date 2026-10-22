// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  SEARCH_MIN_CHARS,
  search_path,
  search_query,
} from "@/app/_components/layout/search.query";
import { SearchResults } from "@/app/_components/layout/search-results";
import { useI18n } from "@/providers/i18n.provider";
import { profile_path } from "@/lib/profile-path";

// Search field of the 404 page: the header's search, inline, so a dead link does not end the visit.
export function NotFoundSearch() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const access = useMemo(() => make_client_access(), []);
  const api = useMemo(() => create_api(access), [access]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const enabled = debounced.length >= SEARCH_MIN_CHARS;
  const { data, isFetching } = useQuery({ ...search_query(api, { q: debounced }), enabled });

  // Enter: every result of the typed phrase on the results page.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const phrase = q.trim();
    if (phrase.length < SEARCH_MIN_CHARS) return;
    router.push(profile_path(params?.customer_country as string | undefined, search_path(phrase)));
  };

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
          <SearchResults
            data={data}
            query={debounced}
            currency={(access.get("cr") ?? "").toUpperCase()}
            onNavigate={() => setQ("")}
            onPhrase={setQ}
          />
        </div>
      )}
    </div>
  );
}
