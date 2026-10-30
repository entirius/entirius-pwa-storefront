// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { create_api } from "@/API/api.context";
import { make_server_access } from "@/API/access/api.server-access";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { categories_query } from "./api.query";
import { HamburgerMenuSheet } from "./hamburger-menu-sheet";
import { LocaleSwitch } from "./locale-switch";
import { Megamenu } from "./megamenu";
import {
  CONFIG_QUERY,
  DESKTOP_MENU_TYPE,
  MENU_TOP_ROW_MAX_ITEMS,
  MENU_TYPE,
  MOBILE_MENU_TYPE,
} from "./menu-config";
import { menu_fits_top_row } from "./menu-layout";

function renderType(type: MENU_TYPE, footer?: React.ReactNode) {
  switch (type) {
    case MENU_TYPE.MEGAMENU:
      return <Megamenu query={CONFIG_QUERY} />;
    case MENU_TYPE.HAMBURGER:
      return <HamburgerMenuSheet query={CONFIG_QUERY} footer={footer} />;
    default:
      return <HamburgerMenuSheet query={CONFIG_QUERY} footer={footer} />;
  }
}

// The root menu level is fetched on the server in the active language (the `lg` cookie) and hydrated, so
// the server render already carries the menu with that language's category keys.
export async function MenuData({ children }: { children: React.ReactNode }) {
  const api = create_api(await make_server_access());
  return (
    <PrefetchBoundary prefetches={[categories_query(api, CONFIG_QUERY)]}>
      {children}
    </PrefetchBoundary>
  );
}

// Does the megamenu share the top row with the logo? Decided here, from the names in the active language: the
// browser gets the final layout at once, nothing has to be measured and nothing moves at hydration.
export async function menu_shares_top_row() {
  if (DESKTOP_MENU_TYPE !== MENU_TYPE.MEGAMENU) return false;
  const api = create_api(await make_server_access());
  const rows = await categories_query(api, CONFIG_QUERY)
    .queryFn()
    .then(({ data }) => data, () => []);
  return menu_fits_top_row(rows.map((row) => row.name), MENU_TOP_ROW_MAX_ITEMS);
}

// Always among the top row's buttons: the phone menu, and a desktop menu that is a hamburger.
export function MenuButton() {
  return (
    <>
      <div className="md:hidden">{renderType(MOBILE_MENU_TYPE, <LocaleSwitch className="flex px-4 pb-4" />)}</div>
      {DESKTOP_MENU_TYPE !== MENU_TYPE.MEGAMENU && (
        <div className="hidden md:flex items-center">
          {renderType(DESKTOP_MENU_TYPE)}
        </div>
      )}
    </>
  );
}

// The header's grid places it: in the top row, or in its own row under it.
export function DesktopMegamenu() {
  if (DESKTOP_MENU_TYPE !== MENU_TYPE.MEGAMENU) return null;
  return (
    <div className="hidden min-w-0 md:block md:[grid-area:nav]">{renderType(DESKTOP_MENU_TYPE)}</div>
  );
}
