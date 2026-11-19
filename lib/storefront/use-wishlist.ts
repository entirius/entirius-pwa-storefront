// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { WishlistItem } from "@entirius/storefront-sdk/product";
import type { WishlistState } from "@entirius/storefront-sdk/storefront";
import { useWishlistStore } from "@/stores/wishlist.store";
import { toggle_on_account } from "@/stores/wishlist-sync";
import { dismiss_notice, notify } from "@/stores/notices.store";
import { open_wishlist } from "@/stores/wishlist-sheet.store";
import { useAuth } from "@/providers/auth.provider";
import { useHydrated } from "@/lib/use-hydrated";

// Signed in, the account keeps the list too. Saving says so with a way to the list; a save the account refuses
// takes that notice back (toggle_on_account shows the error).
export function useWishlist(sku: string | undefined, item: WishlistItem | undefined): WishlistState {
  const mounted = useHydrated();
  const stored = useWishlistStore((s) => (sku ? s.has(sku) : false));
  const toggle = useWishlistStore((s) => s.toggle);
  const { isLoggedIn } = useAuth();

  return {
    mounted,
    active: mounted && stored,
    toggle: () => {
      if (!sku || !item) return;
      const saved = stored
        ? null
        : notify({ message: "wishlist.added", action: { label: "wishlist.view", run: open_wishlist } });
      if (isLoggedIn) {
        void toggle_on_account(sku, item).then((ok) => {
          if (!ok && saved !== null) dismiss_notice(saved);
        });
      } else toggle(sku, item);
    },
  };
}
