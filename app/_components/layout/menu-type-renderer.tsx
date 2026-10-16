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
  MENU_TYPE,
  MOBILE_MENU_TYPE,
} from "./menu-config";

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
export async function MenuTypeRenderer() {
  const api = create_api(await make_server_access());
  return (
    <PrefetchBoundary prefetches={[categories_query(api, CONFIG_QUERY)]}>
      <div className="md:hidden">{renderType(MOBILE_MENU_TYPE, <LocaleSwitch className="flex px-4 pb-4" />)}</div>
      <div className="hidden md:flex items-center">
        {renderType(DESKTOP_MENU_TYPE)}
      </div>
    </PrefetchBoundary>
  );
}
