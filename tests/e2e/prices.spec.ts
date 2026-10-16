// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// Range prices (CONFIGURABLE) show the lowest price and sell a chosen variant;
// products without a price (CUSTOM) say so and cannot be added to the cart.
// Seeded products: captains-living-room-set (CONFIGURABLE, is_range, variants by
// series), chief-engineers-custom-throne (CUSTOM, price: null).

test("catalog tiles never show an empty price", async ({ page }) => {
  await page.goto("/catalog/chairs");
  const tiles = page.locator('a[href^="/product/"]');
  await expect(tiles.first()).toBeVisible();
  await expect(tiles.filter({ hasText: "—" })).toHaveCount(0);
  await expect(
    tiles.filter({ hasText: "Chief Engineer's Custom Throne" }),
  ).toContainText("Price on request");
});

test("configurable product shows its lowest price and sells a chosen variant", async ({ page }) => {
  await page.goto("/product/captains-living-room-set");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const details = page.getByRole("region", { name: "Product details" });
  await expect(details.getByText("from", { exact: true })).toBeVisible();
  await expect(details.getByText(/^€\d+\.\d{2}$/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose an option" })).toBeDisabled();

  await details.getByRole("radio", { name: "Orion Collection" }).click();
  await expect(page).toHaveURL(/[?&]variant=/);
  await expect(page.getByRole("button", { name: "Add to cart" })).toBeEnabled();
});

test("product without a price shows price on request and cannot be bought", async ({ page }) => {
  await page.goto("/product/chief-engineers-custom-throne");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Product details" }).getByText("Price on request")).toBeVisible();
  await expect(page.getByRole("button", { name: "Not available online" })).toBeDisabled();
});

test("search results show range prices", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search products and categories…").fill("living room set");
  const row = page.locator('a[href="/product/captains-living-room-set"]');
  await expect(row).toContainText(/From €\d+\.\d{2}/);
});
