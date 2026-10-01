// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// Smoke path over the seeded zeno dataset: CMS home → catalog → PDP → search.
// Every page is entered through the proxy, so the country cookies are set the
// same way a real visitor gets them.

test("home page renders CMS content", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Welcome to Entirius").first()).toBeVisible();
});

test("catalog lists products and links to the product page", async ({ page }) => {
  await page.goto("/catalog/chairs");
  await expect(page).toHaveTitle(/Chairs/);

  const first_tile = page.locator('a[href^="/product/"]').first();
  await expect(first_tile).toBeVisible();
  const name = (await first_tile.locator("h3").innerText()).trim();

  await first_tile.click();
  await expect(page).toHaveURL(/\/product\//);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
});

test("search sheet returns product results", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search products and categories…").fill("chair");
  await expect(page.locator('[role="dialog"] a[href*="/product/"]').first()).toBeVisible();
});
