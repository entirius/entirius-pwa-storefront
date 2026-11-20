// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useLayout } from "@entirius/storefront-sdk/layout/context";
import { make_client_access } from "@/API/access/api.client-access";

// Language and currency are cookies the API layer reads: set them, drop the cached answers, render again.
export function useLocaleSwitch() {
  const router = useRouter();
  const query_client = useQueryClient();
  const [pending, start] = useTransition();
  const pairs = useLayout().locale?.pairs ?? {};

  function apply(values: Record<string, string>) {
    const access = make_client_access();
    for (const [name, value] of Object.entries(values)) access.set?.(name, value);
    void query_client.invalidateQueries();
    start(() => router.refresh());
  }

  return {
    pending,
    change_language: (next: string) => apply({ lg: next, ...(pairs[next] && { cr: pairs[next] }) }),
    change_currency: (next: string) => apply({ cr: next }),
  };
}
