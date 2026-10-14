// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import countries from "@/_CONFIG/countries.config.json";
import { make_server_access } from "@/API/access/api.server-access";
import { LocaleSwitchClient } from "./locale-switch.client";

type Profile = {
  languages?: string[];
  default_language: string;
  currencies?: string[];
  default_currency: string;
};
const PROFILES = countries as Record<string, Profile>;

// Language -> the currency that goes with it: the default currency of the profile whose default
// language it is (the active profile first), as long as the active profile allows that currency.
function paired_currencies(active: Profile, languages: string[], currencies: string[]) {
  const profiles = [active, ...Object.values(PROFILES)];
  const pairs: Record<string, string> = {};
  for (const language of languages) {
    const match = profiles.find((p) => p.default_language === language);
    if (match && currencies.includes(match.default_currency)) {
      pairs[language] = match.default_currency;
    }
  }
  return pairs;
}

// Language and currency choice allowed by the country profile (`ct` cookie). Renders nothing when
// there is no real choice (one language and one currency).
export async function LocaleSwitch({ className }: { className?: string }) {
  const access = await make_server_access();
  const profile = PROFILES[access.get("ct") ?? ""] ?? PROFILES.default;
  const languages = profile.languages ?? [profile.default_language];
  const currencies = profile.currencies ?? [profile.default_currency];
  if (languages.length < 2 && currencies.length < 2) return null;

  const language = access.get("lg") ?? profile.default_language;
  const currency = access.get("cr") ?? profile.default_currency;
  return (
    <LocaleSwitchClient
      className={className}
      languages={languages}
      currencies={currencies}
      language={languages.includes(language) ? language : profile.default_language}
      currency={currencies.includes(currency) ? currency : profile.default_currency}
      pairs={paired_currencies(profile, languages, currencies)}
    />
  );
}
