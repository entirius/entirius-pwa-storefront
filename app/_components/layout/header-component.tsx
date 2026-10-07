// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { NavigationComponent } from "./navigation-component";
import { WishlistSheet } from "./wishlist-sheet";
import { CartSheet } from "./cart-sheet";
import { AccountNav } from "./account-nav";
import { SearchSheet } from "./search-sheet";
import { LinkDynamic } from "@/lib/link-dynamic";
import { BrandMark } from "./brand-mark";
import { SITE_NAME } from "@/_CONFIG/app.config.json";

export function HeaderComponent() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
        <LinkDynamic href="/" className="flex items-center" aria-label={`${SITE_NAME} — home`}>
          <BrandMark />
        </LinkDynamic>
        <div className="flex items-center gap-2">
          <NavigationComponent />
          <SearchSheet />
          <WishlistSheet />
          <CartSheet />
          <AccountNav />
        </div>
      </div>
    </header>
  );
}