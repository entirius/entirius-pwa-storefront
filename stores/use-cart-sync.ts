// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import { useCartStore } from "@/stores/cart.store";
import { cart_query } from "@/stores/cart.query";
import { useAuth } from "@/providers/auth.provider";

// Shared create-or-patch sync for the cart. The cart page and the checkout page
// run this — the queryKey is derived from the local items, so TanStack dedupes to
// a single backend call (and a single `cid`) across them. `enabled` lets a caller
// hold the sync off.
export function useCartSync(enabled = true) {
  const access = useMemo(() => make_client_access(), []);
  const api = useMemo(() => create_api(access), [access]);
  const currency = useMemo(
    () => (access.get("cr") ?? "eur").toUpperCase(),
    [access],
  );

  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);

  // Re-key the cart on login/logout. `isLoggedIn` (flipped client-side on login)
  // re-renders this hook so the fresh `uid` cookie is read and the query refetches
  // — that refetch carries the bearer token, binding the cart to the customer.
  const { isLoggedIn } = useAuth();
  const authId = isLoggedIn ? (access.get("uid") ?? null) : null;

  // localStorage is client-only — gate the sync until mounted to avoid an
  // SSR/CSR hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const {
    data: backend,
    isFetching,
    error,
  } = useQuery({
    ...cart_query(api, access, items, currency, authId),
    enabled: mounted && enabled,
  });

  return { mounted, items, backend, isFetching, error, currency, setQty, remove };
}
