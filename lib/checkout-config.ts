// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import appConfig from "@/_CONFIG/app.config.json";

// Optional `CHECKOUT` settings of `_CONFIG/app.config.json`: CMS routes of the legal pages the consent
// line on the review step and the register form link to (`TERMS_ROUTE`, `PRIVACY_ROUTE`, e.g. "terms").
// A route that is absent or null means no link: the consent text shows the page name as plain text.
const settings = (appConfig as { CHECKOUT?: Partial<Record<string, string | null>> }).CHECKOUT ?? {};

const route = (key: string): string | undefined => settings[key]?.replace(/^\/+/, "") || undefined;

export const TERMS_ROUTE = route("TERMS_ROUTE");
export const PRIVACY_ROUTE = route("PRIVACY_ROUTE");
