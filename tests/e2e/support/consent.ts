// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Page } from "@playwright/test";

// A channel with a published cookie banner shows it on the first visit, and it covers the bottom of the phone
// screen (the sticky buy bar stays away while it is open). A spec that is not about the banner answers the banner
// request as a channel without one does: 404, nothing is rendered.
export async function without_cookie_banner(page: Page) {
  await page.route(/\/agreements\/v2\/[^/]+\/cookie-banner\//, (route) =>
    route.fulfill({ status: 404, json: { detail: "Not found." } }),
  );
}
