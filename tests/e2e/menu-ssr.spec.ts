// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// The root menu is fetched on the server, so the first HTML already carries its categories
// (no spinner-then-menu on slow clients). They are buttons, not links: crawlers find the categories in the sitemap.

test("the server HTML carries the root menu", async ({ request }) => {
  const res = await request.get("/", { headers: { cookie: "lg=en" } });
  const html = await res.text();
  expect(html).toMatch(/data-radix-collection-item="">Chairs</);
  expect(html).toMatch(/data-radix-collection-item="">Sofas</);
});
