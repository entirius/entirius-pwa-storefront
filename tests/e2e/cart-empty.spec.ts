// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// An empty cart has no order path; a cart with a product has it. No order is placed.

test("an empty cart shows no order steps, a filled one does", async ({ page }) => {
  await page.goto("/cart");
  await expect(page.getByText("Your cart is empty")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Order steps" })).toHaveCount(0);

  await page.goto("/product/docking-bay-chair");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.locator("header").getByRole("link", { name: /^Cart, 1 item$/ }).click();
  await expect(page.getByRole("navigation", { name: "Order steps" })).toBeVisible();
});
