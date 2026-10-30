// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { DesktopMegamenu, MenuButton, MenuData, menu_shares_top_row } from "./menu-type-renderer";
import { LocaleSwitch } from "./locale-switch";
import { WishlistSheet } from "./wishlist-sheet";
import { CartLink } from "./cart-link.client";
import { AddedToCart } from "./added-to-cart.client";
import { AccountNav } from "./account-nav";
import { SearchSheet } from "./search-sheet";
import { SearchBar } from "./search-bar.client";
import { LinkDynamic } from "@/lib/link-dynamic";
import { BrandMark } from "./brand-mark";
import { SITE_NAME } from "@/_CONFIG/app.config.json";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { cn } from "@/lib/utils";

// One DOM, three layouts, switched by CSS alone, so nothing moves at hydration:
// - phone: the logo on the left, every button on the right;
// - from md: the logo in the centre, buttons on both sides, the menu in its own row under them;
// - from xl, with a short list of categories: one row, the menu on the left, every button on the right.
// The sizes the rest of the header reads: the top row, the menu's own row (0 when it has none), a menu item.
const SIZES = "[--header-top:4rem] [--menu-row:2.75rem] [--menu-item:2.75rem]";
const SIZES_ONE_ROW = "xl:[--header-top:4.5rem] xl:[--menu-row:0rem] xl:[--menu-item:4.5rem]";

export async function HeaderComponent() {
  const { t } = await get_i18n();
  const one_row = await menu_shares_top_row();
  return (
    <header className={cn("sticky top-0 z-sticky border-b border-border bg-card", SIZES, one_row && SIZES_ONE_ROW)}>
      <MenuData>
        <div
          className={cn(
            "mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4",
            "md:grid md:h-auto md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:grid-rows-[var(--header-top)_auto] md:gap-x-6 md:gap-y-0 md:[grid-template-areas:'start_logo_end'_'nav_nav_nav']",
            one_row && "xl:grid-rows-[var(--header-top)] xl:[grid-template-areas:'nav_logo_buttons']",
          )}
        >
          <LinkDynamic
            href="/"
            className="flex min-w-0 items-center md:justify-self-center md:[grid-area:logo]"
            aria-label={t("header.home", { name: SITE_NAME })}
          >
            <BrandMark />
          </LinkDynamic>
          <DesktopMegamenu />
          <div
            className={cn(
              "flex shrink-0 items-center gap-2 md:contents",
              one_row && "xl:flex xl:justify-end xl:[grid-area:buttons]",
            )}
          >
            <div className="flex items-center gap-2 md:[grid-area:start]">
              <MenuButton />
              <SearchSheet />
              <SearchBar />
              <LocaleSwitch className="hidden md:flex" icons />
            </div>
            <div className="flex items-center gap-2 md:justify-end md:[grid-area:end]">
              <WishlistSheet />
              <AccountNav />
              <CartLink />
            </div>
          </div>
        </div>
      </MenuData>
      <AddedToCart />
    </header>
  );
}
