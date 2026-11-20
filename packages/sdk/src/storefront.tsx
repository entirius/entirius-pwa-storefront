// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { createContext, useContext, type ComponentType, type MouseEvent, type ReactNode } from "react";
import type {
  ForgotPasswordFormProps,
  HeaderSearch,
  LoginFormProps,
  MenuCategory,
  Notice,
  RegisterFormProps,
} from "./layout/types";
import type { ProductCardData, ProductCardState, QuickAddItem, QuickAddState } from "./product/card";
import type { Price, WishlistItem } from "./product/types";

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

  // Menu rows: the configured top level (null) or a parent's branch, its own row first.
  useMenuBranch: (parent: { url_key: string; name: string } | null) => {
    categories: MenuCategory[];
    loading: boolean;
    error: string | null;
  };
  // Starts loading a branch ahead of its panel (pointer on the trigger).
  usePrefetchMenuBranch: () => (url_key: string) => void;
  useHeaderSearch: () => HeaderSearch;
  // `signed_in`: after a successful login (the account flag, then the profile page).
  useAccount: () => { logged_in: boolean; signed_in: () => void };
  useCartCount: () => number;
  // The wishlist sheet: open from anywhere (a notice's "View wishlist"), the saved items, which can go to the cart.
  useWishlistSheet: () => {
    open: boolean;
    set_open: (open: boolean) => void;
    count: number;
    items: WishlistItem[];
    movable: (item: WishlistItem) => boolean;
  };
  // Into the cart (asks the stock), then off the wishlist.
  useMoveToCart: (item: WishlistItem & { price: Price }) => { state: QuickAddState; run: (event: MouseEvent) => void };
  // The notices of this page; they are cleared when the path changes.
  useNotices: () => { notices: Notice[]; dismiss: (id: number) => void };
  useLocaleSwitch: () => {
    pending: boolean;
    change_language: (code: string) => void;
    change_currency: (code: string) => void;
  };
  // Forms that carry their own logic. The account ones load on first use; the newsletter one is in the footer.
  forms: {
    login: () => Promise<ComponentType<LoginFormProps>>;
    register: () => Promise<ComponentType<RegisterFormProps>>;
    forgot_password: () => Promise<ComponentType<ForgotPasswordFormProps>>;
    Newsletter: ComponentType<{ className?: string }>;
  };
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
export const useMenuBranch = (parent: { url_key: string; name: string } | null) => useStorefront().useMenuBranch(parent);
export const usePrefetchMenuBranch = () => useStorefront().usePrefetchMenuBranch();
export const useHeaderSearch = () => useStorefront().useHeaderSearch();
export const useAccount = () => useStorefront().useAccount();
export const useCartCount = () => useStorefront().useCartCount();
export const useWishlistSheet = () => useStorefront().useWishlistSheet();
export const useMoveToCart = (item: WishlistItem & { price: Price }) => useStorefront().useMoveToCart(item);
export const useNotices = () => useStorefront().useNotices();
export const useLocaleSwitch = () => useStorefront().useLocaleSwitch();
