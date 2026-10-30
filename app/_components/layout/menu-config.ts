// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import appConfig from "@/_CONFIG/app.config.json";

export const MENU_TYPE = {
  HAMBURGER: "hamburger",
  MEGAMENU: "megamenu",
} as const;
export type MENU_TYPE = (typeof MENU_TYPE)[keyof typeof MENU_TYPE];

// Query passed verbatim to the ROOT categories request. Keys mirror the
// endpoint's allowed querys. Deeper levels are fetched lazily via parent_url_key.
export type CONFIG_QUERY = {
  url_key?: string | string[];
  parent_url_key?: string | null;
  depth?: number;
  language?: string | string[];
};

export type CATEGORY = {
  id?: string | number;
  url_key: string;
  name: string;
  has_children: boolean;
  // Only in a `parent_url_key` response: the row's subtree.
  children?: CATEGORY[];
  // The parent itself as the first row of its branch (NORM_CATEGORY_BRANCH).
  is_self?: boolean;
};

const raw = (
  appConfig as {
    MENU_CINFGURATION?: { TYPES?: unknown[]; CONFIG_QUERY?: CONFIG_QUERY; TOP_ROW_MAX_ITEMS?: unknown };
  }
).MENU_CINFGURATION;

function parse_type(value: unknown): MENU_TYPE {
  return value === MENU_TYPE.MEGAMENU ? MENU_TYPE.MEGAMENU : MENU_TYPE.HAMBURGER;
}

// TYPES tuple order: [mobile, desktop]. Anything unknown/missing falls back to hamburger.
export const MOBILE_MENU_TYPE: MENU_TYPE = parse_type(raw?.TYPES?.[0]);
export const DESKTOP_MENU_TYPE: MENU_TYPE = parse_type(raw?.TYPES?.[1]);

// How many categories may share the top row with the logo on a wide screen; more move the menu to its own row.
// 0: always its own row.
export const MENU_TOP_ROW_MAX_ITEMS =
  typeof raw?.TOP_ROW_MAX_ITEMS === "number" ? raw.TOP_ROW_MAX_ITEMS : 3;

// Shared query for the single root request (default: no scoping).
export const CONFIG_QUERY: CONFIG_QUERY = raw?.CONFIG_QUERY ?? {};
