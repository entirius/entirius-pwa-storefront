// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { createContext, useContext, type MouseEvent, type ReactNode } from "react";
import type { ProductCardData, ProductCardState, QuickAddItem, QuickAddState } from "./product/card";
import type { WishlistItem } from "./product/types";

export type WishlistState = {
  // False until the page has hydrated: the server does not know the visitor's list.
  mounted: boolean;
  active: boolean;
  toggle: () => void;
};

// What the core lends a theme at run time. The core fills it once in the root layout; a theme reaches it through the
// hooks and components of this SDK, never through the core's modules. A mock fills it in a theme's tests.
export type Storefront = {
  // The URL a backend picture may be loaded from; anything else gives the placeholder.
  media_src: (src: string | null | undefined) => string;
  image_placeholder: string;
  // A shop path with the profile prefix of the current country.
  useLocalHref: (href: string) => string;
  useWishlist: (sku: string | undefined, item: WishlistItem | undefined) => WishlistState;
  useProductCard: (product: ProductCardData, compact: boolean) => ProductCardState;
  useQuickAdd: (item: QuickAddItem) => { state: QuickAddState; run: (event: MouseEvent) => void };
  // The lowest price of the last 30 days of a discounted product, null while unknown or without one.
  useOmnibus: (sku: string) => { gross: string; currency: string } | null;
};

const StorefrontContext = createContext<Storefront | null>(null);

export function StorefrontProvider({ value, children }: { value: Storefront; children: ReactNode }) {
  return <StorefrontContext value={value}>{children}</StorefrontContext>;
}

export function useStorefront(): Storefront {
  const storefront = useContext(StorefrontContext);
  if (!storefront) throw new Error("useStorefront must be used within <StorefrontProvider>");
  return storefront;
}

export const useWishlist = (sku: string | undefined, item: WishlistItem | undefined) =>
  useStorefront().useWishlist(sku, item);
export const useProductCard = (product: ProductCardData, compact: boolean) =>
  useStorefront().useProductCard(product, compact);
export const useQuickAdd = (item: QuickAddItem) => useStorefront().useQuickAdd(item);
export const useOmnibus = (sku: string) => useStorefront().useOmnibus(sku);
