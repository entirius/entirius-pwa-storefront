// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";

// Search results page: /search?q= lists every product the phrase finds with the catalog's tiles,
// filters and pagination. The header's search sheet and the 404 page lead there on Enter.
// Seed: "chair" finds 10 products, 2 of them in the Orion series.

const tiles = (page: Page) => page.locator("[data-catalog-list]").locator('a[href^="/product/"]');
const heading = (page: Page) => page.getByRole("heading", { level: 1 });

test("Enter in the search sheet opens the results page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  const field = page.getByPlaceholder("Search products and categories…");
  await field.fill("chair");
  await field.press("Enter");

  await expect(page).toHaveURL(/\/search\?q=chair$/);
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(heading(page)).toHaveText("Results for “chair”");
  await expect(page).toHaveTitle(/Results for “chair”/);
  await expect(tiles(page)).toHaveCount(10);
});

test("the search sheet links to all results", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search products and categories…").fill("chair");
  await page.getByRole("dialog").getByRole("link", { name: "Show all results" }).click();
  await expect(page).toHaveURL(/\/search\?q=chair$/);
  await expect(tiles(page)).toHaveCount(10);
});

test("the results page answers 200 and stays out of the index", async ({ page }) => {
  const response = await page.goto("/search?q=chair");
  expect(response?.status()).toBe(200);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("the results page pages with the catalog's pagination", async ({ page }) => {
  await page.goto("/search?q=chair&limit=4");
  await expect(tiles(page)).toHaveCount(4);
  await page.getByRole("link", { name: "Go to next page" }).first().click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page).toHaveURL(/q=chair/);
  await expect(tiles(page)).toHaveCount(4);
  await page.getByRole("link", { name: "Go to next page" }).first().click();
  await expect(page).toHaveURL(/page=3/);
  await expect(tiles(page)).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Go to next page" })).toHaveCount(0);
});

test("filters narrow the results and keep the phrase", async ({ page }) => {
  await page.goto("/search?q=chair");
  const panel = page.getByRole("complementary", { name: "Filters" });
  await expect(tiles(page)).toHaveCount(10);

  // /options/ counts the whole channel, not the results: a positive count is not shown.
  const orion = panel.locator("label", { hasText: "Orion Collection" });
  await expect(orion).not.toContainText(/\d/);

  await panel.getByRole("checkbox", { name: "Orion Collection" }).click();
  await panel.getByRole("button", { name: "Apply (1)" }).click();
  await expect(page).toHaveURL(/q_series=orion/);
  await expect(page).toHaveURL(/q=chair/);
  await expect(tiles(page)).toHaveCount(2);
  await expect(tiles(page).first()).toContainText("Flight Deck Command Chair");

  // A new phrase starts without the previous one's filters.
  await page.getByRole("button", { name: "Search" }).click();
  const field = page.getByPlaceholder("Search products and categories…");
  await field.fill("sofa");
  await field.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=sofa$/);
  await expect(tiles(page)).toHaveCount(7);
  await expect(panel.getByRole("checkbox", { name: "Orion Collection" })).not.toBeChecked();
  await expect(panel.getByRole("button", { name: "Apply (0)" })).toBeDisabled();
});

test("a phrase with no match and a too short one", async ({ page }) => {
  await page.goto("/search?q=zzzzqq");
  await expect(heading(page)).toHaveText("Results for “zzzzqq”");
  await expect(page.locator("[data-catalog-empty]")).toHaveText("No results found.");

  await page.goto("/search?q=a");
  await expect(heading(page)).toHaveText("Search");
  await expect(page.locator("[data-search-hint]")).toHaveText("Type at least 2 characters to search.");
  await expect(tiles(page)).toHaveCount(0);
});

test("Enter on the not-found page opens the results page", async ({ page }) => {
  await page.goto("/does-not-exist");
  const field = page.locator("[data-notfound-search] input");
  await field.fill("sofa");
  await field.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=sofa$/);
  await expect(tiles(page)).toHaveCount(7);
});
