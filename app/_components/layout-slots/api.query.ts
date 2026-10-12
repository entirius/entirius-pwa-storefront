// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import { create_api } from "@/API/api.context";
import { make_static_access } from "@/API/access/api.static-access";
import { API_CMS_ROUTES_ROUTE, API_CMS_STATIC_PAGE_ROUTE } from "@/API/api.routes";
import type { CmsPage } from "@/types/cms.types";
import { _LOGGER } from "@/lib/logger";

// A layout slot is an ordinary contentdb page published under a reserved route ("layout-announcement").
// The footer is not a slot: it is the CMS footer extender (app/_components/layout/footer-component.tsx).
export const LAYOUT_SLOTS = ["announcement", "before-footer"] as const;
export type LayoutSlotName = (typeof LAYOUT_SLOTS)[number];
// The builder page answers 404 for routes with this prefix: slots are not pages.
export const LAYOUT_ROUTE_PREFIX = "layout-";

const slot_route = (name: LayoutSlotName) => `${LAYOUT_ROUTE_PREFIX}${name}`;

// Every slot page in one request: first the list of routes (asking the pages endpoint for a route that
// does not exist is a 400), then the pages of the slot routes that do. Slots hold no per-visitor data
// (a static access); React.cache() makes it one fetch per request for every slot.
const fetch_slot_pages = cache(async (): Promise<CmsPage[]> => {
  const api = create_api(make_static_access({}));

  const [routes_error, routes] = await api.FETCH_METHOD<{ data: { url: string }[] }>(
    API_CMS_ROUTES_ROUTE,
  );
  if (routes_error) throw new Error(routes_error.message);
  const existing = LAYOUT_SLOTS.map(slot_route).filter((route) =>
    routes?.data.some((r) => r.url === route),
  );
  if (!existing.length) return [];

  const [error, pages] = await api.FETCH_METHOD<{ data: CmsPage[] }>(
    API_CMS_STATIC_PAGE_ROUTE,
    { querys: { routes: existing, limit: 50, page: 1 } },
  );
  if (error) throw new Error(error.message);
  return pages?.data ?? [];
});

// The page of a slot in the given language; a page in another language when there is none (the
// storefront serves one page to every language, like the builder does).
export async function load_layout_slot(
  name: LayoutSlotName,
  language: string,
): Promise<CmsPage | null> {
  let pages: CmsPage[];
  try {
    pages = await fetch_slot_pages();
  } catch (e) {
    _LOGGER({ type: "warning", message: "[layout slots] fetch failed", print: e });
    return null;
  }
  const own = pages.filter((p) => p.routes.includes(slot_route(name)));
  return own.find((p) => p.language?.toLowerCase() === language) ?? own[0] ?? null;
}
