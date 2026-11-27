// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import type { LayoutData, LocaleChoice } from "@entirius/storefront-sdk/layout";
import { BRAND, SITE_NAME } from "@/_CONFIG/app.config.json";
import countries from "@/_CONFIG/countries.config.json";
import { create_api } from "@/API/api.context";
import { make_server_access } from "@/API/access/api.server-access";
import { API_CMS_FOOTER_ROUTE, API_CMS_LEGAL_PAGE_ROUTE } from "@/API/api.routes";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { NORM_FOOTER } from "@/utils/NORMALIZERS/footer.normalizer";
import { NORM_LEGAL_LINKS } from "@/utils/NORMALIZERS/legal-links.normalizer";
import { categories_query } from "./menu.query";
import { CONFIG_QUERY, DESKTOP_MENU_TYPE, MENU_TOP_ROW_MAX_ITEMS, MENU_TYPE, MOBILE_MENU_TYPE } from "./menu-config";
import { menu_fits_top_row } from "./menu-layout";

type Profile = {
  languages?: string[];
  default_language: string;
  currencies?: string[];
  default_currency: string;
};
const PROFILES = countries as Record<string, Profile>;

const load_footer = cache(async () => {
  const api = create_api(await make_server_access());
  const [error, response] = await api.FETCH_METHOD(API_CMS_FOOTER_ROUTE, {});
  return error ? [] : NORM_FOOTER(response);
});

// The published legal pages of the active language, linked from the footer's bottom bar. None (or no answer) = no links.
const load_legal_links = cache(async (language: string) => {
  const api = create_api(await make_server_access());
  const [error, response] = await api.FETCH_METHOD(API_CMS_LEGAL_PAGE_ROUTE, {
    querys: { language, limit: 50, page: 1 },
  });
  return error ? [] : NORM_LEGAL_LINKS(response);
});

// The desktop megamenu shares the logo's row when its top level is short enough.
async function menu_shares_top_row() {
  if (DESKTOP_MENU_TYPE !== MENU_TYPE.MEGAMENU) return false;
  const api = create_api(await make_server_access());
  const rows = await categories_query(api, CONFIG_QUERY)
    .queryFn()
    .then(({ data }) => data, () => []);
  return menu_fits_top_row(rows.map((row) => row.name), MENU_TOP_ROW_MAX_ITEMS);
}

// The visitor's country (the `ct` cookie) decides the languages and currencies to switch between.
function paired_currencies(active: Profile, languages: string[], currencies: string[]) {
  const profiles = [active, ...Object.values(PROFILES)];
  const pairs: Record<string, string> = {};
  for (const language of languages) {
    const match = profiles.find((p) => p.default_language === language);
    if (match && currencies.includes(match.default_currency)) pairs[language] = match.default_currency;
  }
  return pairs;
}

async function locale_choice(): Promise<LocaleChoice | null> {
  const access = await make_server_access();
  const profile = PROFILES[access.get("ct") ?? ""] ?? PROFILES.default;
  const languages = profile.languages ?? [profile.default_language];
  const currencies = profile.currencies ?? [profile.default_currency];
  if (languages.length < 2 && currencies.length < 2) return null;
  const language = access.get("lg") ?? profile.default_language;
  const currency = access.get("cr") ?? profile.default_currency;
  return {
    languages,
    currencies,
    language: languages.includes(language) ? language : profile.default_language,
    currency: currencies.includes(currency) ? currency : profile.default_currency,
    pairs: paired_currencies(profile, languages, currencies),
  };
}

export const load_layout_data = cache(async (): Promise<LayoutData> => {
  const { language } = await get_i18n();
  const [one_row, locale, footer, legal] = await Promise.all([
    menu_shares_top_row(),
    locale_choice(),
    load_footer(),
    load_legal_links(language),
  ]);
  return {
    site: {
      name: SITE_NAME,
      logo: (BRAND.LOGO as string | null) ?? null,
      logo_alt: (BRAND.LOGO_ALT as string | null) ?? SITE_NAME,
    },
    menu: { mobile: MOBILE_MENU_TYPE, desktop: DESKTOP_MENU_TYPE, one_row },
    locale,
    footer,
    legal,
  };
});
