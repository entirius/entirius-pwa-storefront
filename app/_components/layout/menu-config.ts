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
};

const raw = (
  appConfig as {
    MENU_CINFGURATION?: { TYPES?: unknown[]; CONFIG_QUERY?: CONFIG_QUERY };
  }
).MENU_CINFGURATION;

function parse_type(value: unknown): MENU_TYPE {
  return value === MENU_TYPE.MEGAMENU ? MENU_TYPE.MEGAMENU : MENU_TYPE.HAMBURGER;
}

// TYPES tuple order: [mobile, desktop]. Anything unknown/missing falls back to hamburger.
export const MOBILE_MENU_TYPE: MENU_TYPE = parse_type(raw?.TYPES?.[0]);
export const DESKTOP_MENU_TYPE: MENU_TYPE = parse_type(raw?.TYPES?.[1]);

// Shared query for the single root request (default: no scoping).
export const CONFIG_QUERY: CONFIG_QUERY = raw?.CONFIG_QUERY ?? {};
