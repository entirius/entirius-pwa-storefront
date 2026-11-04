// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";

// Gifts on the cart page. Seeded: the gratis rule GRATIS_STEP (EUR) with the ottomans as its gift pool, at
// 300 / 600 / 1000 EUR one / two / three pieces (seed step "6b Gratis Pool"); Cargo Pod Ottoman €2.69 and
// Satellite Ottoman €3.19 as gifts; docking-bay-chair at €319.00; PERCENT10 is exclusive. No order is placed.

async function chair_in_cart(page: Page) {
  await page.goto("/product/docking-bay-chair");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.locator("header").getByRole("link", { name: /^Cart, 1 item$/ }).click();
  const items = page.getByRole("region", { name: "Items in your cart" });
  const gift = page.getByRole("region", { name: "Gift" });
  const total = page.getByRole("complementary", { name: "Order summary" }).locator("div", { hasText: /^Total/ }).last();
  await expect(total).toContainText("€319.00");
  return { items, gift, total };
}

test("a gift is picked over the threshold, follows the tiers and can be removed", async ({ page }) => {
  const { items, gift, total } = await chair_in_cart(page);

  // 319 EUR: the first tier (one piece) is reached, the next one is 600.
  await expect(gift).toContainText("Add €281.00 more to get 2 gifts.");
  await expect(gift).toContainText("Choose your gift.");
  await gift.getByRole("radio", { name: /Cargo Pod Ottoman/ }).click();

  const gift_line = items.getByRole("listitem").filter({ hasText: "Cargo Pod Ottoman" });
  await expect(gift_line).toContainText("Gift");
  await expect(gift_line).toContainText("€2.69");
  await expect(total).toContainText("€321.69");
  await expect(gift.getByRole("radio", { name: /Cargo Pod Ottoman/ })).toBeChecked();

  // 638 EUR: two pieces allowed, the gift keeps its one piece until the customer adds the second.
  const chair_line = items.getByRole("listitem").filter({ hasText: "Docking Bay Chair" });
  await chair_line.getByRole("button", { name: /increase/i }).click();
  await expect(gift).toContainText("Choose your gift, up to 2 pieces.");
  await expect(gift).toContainText("Add €362.00 more to get 3 gifts.");
  await expect(total).toContainText("€640.69");
  await gift_line.getByRole("button", { name: /increase/i }).click();
  await expect(total).toContainText("€643.38");

  // Back to 319 EUR: two pieces are over the tier, so the backend drops the gift and the card says so.
  await chair_line.getByRole("button", { name: /decrease/i }).click();
  await expect(total).toContainText("€319.00");
  await expect(gift_line).toHaveCount(0);
  await expect(gift).toContainText("Your gift was removed because the cart total changed. Choose it again.");

  await gift.getByRole("radio", { name: /Satellite Ottoman/ }).click();
  const other_line = items.getByRole("listitem").filter({ hasText: "Satellite Ottoman" });
  await expect(other_line).toContainText("€3.19");
  await expect(total).toContainText("€322.19");
  await other_line.getByRole("button", { name: "Remove Satellite Ottoman" }).click();
  await expect(other_line).toHaveCount(0);
  await expect(total).toContainText("€319.00");
});

test("a discount code keeps the gift, an exclusive one replaces it", async ({ page }) => {
  const { items, gift, total } = await chair_in_cart(page);
  await gift.getByRole("radio", { name: /Cargo Pod Ottoman/ }).click();
  await expect(total).toContainText("€321.69");

  const summary = page.getByRole("complementary", { name: "Order summary" });
  await summary.getByRole("textbox", { name: "Discount code" }).fill("NOT-A-CODE");
  await summary.getByRole("button", { name: "Apply" }).click();
  await expect(summary.getByRole("alert")).toHaveText("This code can’t be used with your cart.");
  // The refused code is the code form's business, not an item problem.
  await expect(items.getByRole("alert")).toHaveCount(0);
  await expect(items.getByRole("listitem").filter({ hasText: "Cargo Pod Ottoman" })).toContainText("Gift");
  await expect(total).toContainText("€321.69");

  await summary.getByRole("textbox", { name: "Discount code" }).fill("PERCENT10");
  await summary.getByRole("button", { name: "Apply" }).click();
  await expect(summary.getByRole("alert")).toHaveText("Your gift was removed: it can’t be combined with this code.");
  await expect(items.getByRole("listitem").filter({ hasText: "Cargo Pod Ottoman" })).toHaveCount(0);
  await expect(total).toContainText("€287.10");
});
