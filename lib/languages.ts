// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import countries from "@/_CONFIG/countries.config.json";

// Every language any country profile offers.
export const LANGUAGES: string[] = [
  ...new Set(Object.values(countries as Record<string, { languages?: string[] }>).flatMap((c) => c.languages ?? [])),
];
