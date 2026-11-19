// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { HeaderSearch } from "@entirius/storefront-sdk/layout";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { profile_path } from "@/lib/profile-path";
import { SEARCH_MIN_CHARS, search_path, search_query } from "@/lib/search/search.query";

export function useHeaderSearch(): HeaderSearch {
  const router = useRouter();
  const params = useParams();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  const access = useMemo(() => make_client_access(), []);
  const api = useMemo(() => create_api(access), [access]);

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

  return { open, q, setQ, debounced, enabled, min_chars: SEARCH_MIN_CHARS, data, isFetching, isError, onOpenChange, onSubmit };
}
