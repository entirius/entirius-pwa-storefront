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
});
