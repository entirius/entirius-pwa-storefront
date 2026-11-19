// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Link } from "@entirius/storefront-sdk/components/link";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { useLayout } from "@entirius/storefront-sdk/layout/context";
import { cn } from "@theme/lib/utils";
import { AccountNav } from "@theme/layout/account-nav";
import { BrandMark } from "@theme/layout/brand-mark";
import { CartLink } from "@theme/layout/cart-link";
import { LocaleSwitch } from "@theme/layout/locale-switch";
import { DesktopMegamenu, MenuButton } from "@theme/layout/menu";
import { Notices } from "@theme/layout/notices";
import { SearchBar } from "@theme/layout/search-bar";
import { SearchSheet } from "@theme/layout/search-sheet";
import { WishlistSheet } from "@theme/layout/wishlist-sheet";

const SIZES = "[--header-top:4rem] [--menu-row:2.75rem] [--menu-item:2.75rem]";
const SIZES_ONE_ROW = "xl:[--header-top:4.5rem] xl:[--menu-row:0rem] xl:[--menu-item:4.5rem]";

// The header: logo, menus, search, locale, wishlist, account and cart, with the notices under it.
export function Header() {
  const { t } = useI18n();
  const { site, menu } = useLayout();
  const one_row = menu.one_row;

  return (
    <header className={cn("sticky top-0 z-sticky border-b border-border bg-card", SIZES, one_row && SIZES_ONE_ROW)}>
      <div
        data-header-bar
        className={cn(
          "mx-auto flex h-16 w-full max-w-(--page-max-width) items-center justify-between gap-3 px-4",
          "md:grid md:h-auto md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:grid-rows-[var(--header-top)_auto] md:gap-x-6 md:gap-y-0 md:[grid-template-areas:'start_logo_end'_'nav_nav_nav']",
          one_row && "xl:grid-rows-[var(--header-top)] xl:[grid-template-areas:'nav_logo_buttons']",
        )}
      >
        <Link
          href="/"
          data-header-logo
          className="flex min-w-0 items-center md:justify-self-center md:[grid-area:logo]"
          aria-label={t("header.home", { name: site.name })}
        >
          <BrandMark />
        </Link>
        <DesktopMegamenu />
        <div
          data-header-actions
          className={cn("flex shrink-0 items-center gap-2 md:contents", one_row && "xl:flex xl:justify-end xl:[grid-area:buttons]")}
        >
          <div data-header-start className="flex items-center gap-2 md:[grid-area:start]">
            <MenuButton />
            <SearchSheet />
            <SearchBar />
            <LocaleSwitch className="hidden md:flex" icons />
          </div>
          <div data-header-end className="flex items-center gap-2 md:justify-end md:[grid-area:end]">
            <WishlistSheet />
            <AccountNav />
            <CartLink />
          </div>
        </div>
      </div>
      {/* Notices under the header, on the right from sm. */}
      <div className="pointer-events-none fixed inset-x-4 top-20 z-toast flex flex-col sm:left-auto sm:w-96 md:top-[calc(var(--header-top)+var(--menu-row)+1rem)]">
        <Notices />
      </div>
    </header>
  );
}
