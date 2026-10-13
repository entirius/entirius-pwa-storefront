// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import appConfig from "@/_CONFIG/app.config.json";

// Optional `CONTACT_FORMS` settings of `_CONFIG/app.config.json`.
// `NOTIFY_ATTRIBUTES`: attribute idxs (e.g. ["brand", "series"]) whose values on a sold-out product go into
// its "tell me when a similar product arrives" request, so the seller can search by them. Empty or absent =
// the request carries the SKU, name and category only.
const settings = (appConfig as { CONTACT_FORMS?: { NOTIFY_ATTRIBUTES?: string[] } }).CONTACT_FORMS ?? {};

export const NOTIFY_ATTRIBUTES: string[] = settings.NOTIFY_ATTRIBUTES ?? [];
