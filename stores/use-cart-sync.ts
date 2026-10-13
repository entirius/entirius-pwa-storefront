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
import { stocks_query } from "@/app/[customer_country]/(product)/product/[product_url_key]/stock.query";
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
  // with the bearer token. The customer's cart itself is settled before that, in
  // merge_cart_on_login() (stores/cart-login.ts).
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

  // Real-time stock per SKU: caps the quantity at what is available. A quantity above it (set in an
  // earlier session or while the stock was higher) is lowered, so the cart never asks for more.
  const skus = Object.keys(items);
  const { data: stocks } = useQuery({
    ...stocks_query(api, { skus }),
    enabled: mounted && enabled && skus.length > 0,
  });
  useEffect(() => {
    for (const [sku, item] of Object.entries(items)) {
      const available = stocks?.[sku]?.quantity;
      if (available && available > 0 && item.quantity > available) setQty(sku, available, available);
    }
  }, [stocks, items, setQty]);

  return { mounted, items, backend, isFetching, error, currency, stocks, setQty, remove };
}
