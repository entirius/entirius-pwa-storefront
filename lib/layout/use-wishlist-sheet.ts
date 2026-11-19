// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { Price, WishlistItem } from "@entirius/storefront-sdk/product";
import { useWishlistStore } from "@/stores/wishlist.store";
import { useWishlistSheet as useSheetStore } from "@/stores/wishlist-sheet.store";
import { remove_from_account } from "@/stores/wishlist-sync";
import { useAuth } from "@/providers/auth.provider";
import { buy_block } from "@/lib/buy-rules";
import { useQuickAdd } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/use-quick-add";

// Into the cart when the rules of the type let it (a variant to choose or no price does not).
const movable = (item: WishlistItem) =>
  item.product_type ? buy_block(item.product_type, { price: item.price }) === null : !item.price?.from;

export function useWishlistSheet() {
  const count = useWishlistStore((s) => s.count());
  const items = useWishlistStore((s) => s.items);
  // Controlled, so "View wishlist" in a notice opens it too.
  const open = useSheetStore((s) => s.open);
  const set_open = useSheetStore((s) => s.setOpen);
  return { open, set_open, count, items: Object.values(items), movable };
}

export function useMoveToCart(item: WishlistItem & { price: Price }) {
  const { isLoggedIn } = useAuth();
  const remove = useWishlistStore((s) => s.remove);
  return useQuickAdd(item, () => (isLoggedIn ? void remove_from_account(item.sku) : remove(item.sku)));
}
