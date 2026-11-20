// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { ReactNode } from "react";
import { LayoutProvider } from "@entirius/storefront-sdk/layout/context";
import { create_api } from "@/API/api.context";
import { make_server_access } from "@/API/access/api.server-access";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { categories_query } from "./menu.query";
import { CONFIG_QUERY } from "./menu-config";
import { load_layout_data } from "./layout-data";

// The layout's data for the theme's header and footer (useLayout()), with the menu's top level prefetched, so
// the menus are in the server HTML.
export async function LayoutRuntime({ children }: { children: ReactNode }) {
  const api = create_api(await make_server_access());
  const data = await load_layout_data();
  return (
    <PrefetchBoundary prefetches={[categories_query(api, CONFIG_QUERY)]}>
      <LayoutProvider value={data}>{children}</LayoutProvider>
    </PrefetchBoundary>
  );
}
