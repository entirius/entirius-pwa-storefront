// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { NavigationComponent } from "./navigation-component";
import { LocaleSwitch } from "./locale-switch";
import { WishlistSheet } from "./wishlist-sheet";
import { CartLink } from "./cart-link.client";
import { AddedToCart } from "./added-to-cart.client";
import { AccountNav } from "./account-nav";
import { SearchSheet } from "./search-sheet";
import { LinkDynamic } from "@/lib/link-dynamic";
import { BrandMark } from "./brand-mark";
import { SITE_NAME } from "@/_CONFIG/app.config.json";
import { get_i18n } from "@/lib/i18n/i18n.server";

export async function HeaderComponent() {
  const { t } = await get_i18n();
  return (
    <header className="sticky top-0 z-sticky border-b border-border bg-card">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4">
        <LinkDynamic href="/" className="flex min-w-0 items-center" aria-label={t("header.home", { name: SITE_NAME })}>
          <BrandMark />
        </LinkDynamic>
        <div className="flex shrink-0 items-center gap-2">
          <NavigationComponent />
          <SearchSheet />
          <WishlistSheet />
          <CartLink />
          <AccountNav />
          <LocaleSwitch className="hidden md:flex" />
        </div>
      </div>
      <AddedToCart />
    </header>
  );
}