// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// A missing product, category or CMS page answers 404 (proxy.ts asks the API; the page alone would
// stream 200), and the not-found page keeps the visit alive: a search field and category links.

for (const path of ["/product/does-not-exist", "/catalog/does-not-exist", "/does-not-exist"]) {
  test(`${path} answers 404 with the not-found page`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("[data-notfound-search]")).toBeVisible();
  });
}

test("existing addresses are not hit by the 404 check", async ({ request }) => {
  for (const path of ["/", "/catalog/chairs", "/cart"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
});

test("the not-found page links to the menu's top categories and searches", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/does-not-exist");
  const links = page.locator("[data-notfound-categories] a");
  await expect(links.first()).toBeVisible();
  await expect(links.first()).toHaveAttribute("href", /\/catalog\//);
  // The same categories as the header menu, not the roots of the category tree ("Root Category").
  const menu = (await page.getByRole("navigation", { name: "Main" }).getByRole("listitem").allInnerTexts()).map((t) => t.trim());
  await expect(links).toHaveText(menu);

  await page.locator("[data-notfound-search] input").fill("chair");
  await expect(page.locator("[data-notfound-search] a").first()).toBeVisible();
});
