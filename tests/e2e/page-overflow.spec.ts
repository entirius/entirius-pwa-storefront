// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// A full-bleed CMS section is `100vw` wide, and 100vw includes the vertical scrollbar: the page then scrolled
// sideways by half the scrollbar. Headless Chrome hides scrollbars by default, which hides the bug too.
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

for (const width of [390, 1280, 1920]) {
  test(`the home page does not scroll sideways at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator("section[data-width=full_width]").first()).toBeVisible();

    const { scroll, client } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(scroll).toBe(client);
  });
}
