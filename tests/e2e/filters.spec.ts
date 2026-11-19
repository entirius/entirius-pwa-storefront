// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// Catalog filters: a panel beside the listing on desktop, a sheet on phones.
// Options come from /options/ with their product counts; a choice applies on
// "Apply" and lives in the URL (q_<filter>=<value>).

const tiles = (page: import("@playwright/test").Page) =>
  page.getByRole("main").locator('a[href^="/product/"]');

test("desktop: pick a series, apply, then clear all", async ({ page }) => {
  await page.goto("/catalog/chairs");
  const panel = page.getByRole("complementary", { name: "Filters" });
  await expect(panel).toBeVisible();
  await expect(tiles(page)).toHaveCount(7);

  // A value no chair has is shown but cannot be picked.
  await expect(panel.getByRole("checkbox", { name: "Outpost Line" })).toBeDisabled();

  await panel.getByRole("checkbox", { name: "Orion Collection" }).click();
  await panel.getByRole("button", { name: "Apply (1)" }).click();
  await expect(page).toHaveURL(/q_series=orion/);
  await expect(tiles(page)).toHaveCount(1);
  await expect(tiles(page).first()).toContainText("Flight Deck Command Chair");
  await expect(panel.getByRole("checkbox", { name: "Orion Collection" })).toBeChecked();

  await panel.getByRole("button", { name: "Clear all" }).click();
  await expect(page).not.toHaveURL(/q_series/);
  await expect(tiles(page)).toHaveCount(7);
});

test("phone: filters open in a sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/catalog/chairs");
  await expect(page.getByRole("complementary", { name: "Filters" })).toBeHidden();
  await page.getByRole("button", { name: "Filters" }).click();
  const sheet = page.getByRole("dialog", { name: "Filters" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("checkbox", { name: "Orion Collection" })).toBeVisible();

  await sheet.getByRole("checkbox", { name: "Orion Collection" }).click();
  await sheet.getByRole("button", { name: "Apply (1)" }).click();
  await expect(page).toHaveURL(/q_series=orion/);
  await expect(sheet).toBeHidden();
});

// The tiles' prices as numbers ("€1,199.00" → 1199), in their order: a reduced tile's lower amount (the struck one is
// higher; the lowest 30-day price line is left out). A made-to-order chair has none and is left out.
const tile_prices = async (page: import("@playwright/test").Page) =>
  (await tiles(page).allInnerTexts())
    .map((text) => [...text.split("Lowest price")[0].matchAll(/€([\d,]+\.\d{2})/g)].map((m) => Number(m[1].replace(/,/g, ""))))
    .filter((amounts) => amounts.length > 0)
    .map((amounts) => Math.min(...amounts));

test("desktop: sort by price, highest first, and turn it off again", async ({ page }) => {
  await page.goto("/catalog/chairs");
  const panel = page.getByRole("complementary", { name: "Filters" });
  const descending = panel.getByRole("button", { name: "Price, descending" });
  await descending.click();
  await expect(descending).toHaveAttribute("aria-pressed", "true");
  await panel.getByRole("button", { name: "Apply (1)" }).click();
  await expect(page).toHaveURL(/s_price=DESC/);

  await expect(tiles(page)).toHaveCount(7);
  const prices = await tile_prices(page);
  expect(prices.length).toBeGreaterThan(1);
  expect(prices).toEqual([...prices].sort((a, b) => b - a));

  // A second click on the active direction drops the sort.
  await descending.click();
  await expect(descending).toHaveAttribute("aria-pressed", "false");
  await expect(panel.getByRole("button", { name: "Apply (0)" })).toBeDisabled();
});

test("desktop: narrow by the price range, then reset it", async ({ page }) => {
  await page.goto("/catalog/chairs");
  const panel = page.getByRole("complementary", { name: "Filters" });
  const lowest = Math.min(...(await tile_prices(page)));
  // The lower handle up by ten steps (PageUp) commits a new lower bound.
  await panel.getByRole("slider").first().press("PageUp");
  await panel.getByRole("button", { name: "Apply (1)" }).click();
  await expect(page).toHaveURL(new RegExp(`r_price=${Math.floor(lowest) + 10}&r_price=`));
  await expect(tiles(page).first()).toBeVisible();
  expect(Math.min(...(await tile_prices(page)))).toBeGreaterThanOrEqual(Math.floor(lowest) + 10);

  await panel.getByRole("button", { name: "Reset Price" }).click();
  await expect(panel.getByRole("button", { name: "Reset Price" })).toBeHidden();
});

test("phone: closing the sheet without Apply drops the choice", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/catalog/chairs");
  await page.getByRole("button", { name: "Filters" }).click();
  const sheet = page.getByRole("dialog", { name: "Filters" });
  await sheet.getByRole("checkbox", { name: "Orion Collection" }).click();
  await expect(sheet.getByRole("button", { name: "Apply (1)" })).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();

  await page.getByRole("button", { name: "Filters" }).click();
  await expect(sheet.getByRole("checkbox", { name: "Orion Collection" })).not.toBeChecked();
  await expect(page).not.toHaveURL(/q_series/);
});
