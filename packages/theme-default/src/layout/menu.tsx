// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ReactNode } from "react";
import type { MenuType } from "@entirius/storefront-sdk/layout";
import { useLayout } from "@entirius/storefront-sdk/layout/context";
import { HamburgerMenu } from "@theme/layout/hamburger-menu";
import { LocaleSwitch } from "@theme/layout/locale-switch";
import { Megamenu } from "@theme/layout/megamenu";

function renderType(type: MenuType, footer?: ReactNode) {
  return type === "megamenu" ? <Megamenu /> : <HamburgerMenu footer={footer} />;
}

// Phones: the configured mobile menu (with the locale switch at its foot). Desktop: a hamburger configured there.
export function MenuButton() {
  const { menu } = useLayout();
  return (
    <>
      <div className="md:hidden">{renderType(menu.mobile, <LocaleSwitch className="flex px-4 pb-4" />)}</div>
      {menu.desktop !== "megamenu" && (
        <div data-header-nav className="hidden md:flex items-center">
          {renderType(menu.desktop)}
        </div>
      )}
    </>
  );
}

// Desktop: the megamenu in its own row (or next to the logo, see Header).
export function DesktopMegamenu() {
  const { menu } = useLayout();
  if (menu.desktop !== "megamenu") return null;
  return <div data-header-nav className="hidden min-w-0 md:block md:[grid-area:nav]">{renderType(menu.desktop)}</div>;
}
