// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// Manual discount codes on the cart page. Seeded: PERCENT10 (10 %, any cart),
// docking-bay-chair at 319.00 EUR. No order is placed, so no stock is used.

test("a code lowers the total, a wrong code is reported, a code can be removed", async ({ page }) => {
  await page.goto("/product/docking-bay-chair");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.locator("header").getByRole("link", { name: /^Cart, 1 item$/ }).click();
  const summary = page.getByRole("complementary", { name: "Order summary" });
  const total = summary.locator("div", { hasText: /^Total/ }).last();
  await expect(total).toContainText("319.00 EUR");

  const code = summary.getByRole("textbox", { name: "Discount code" });
  await code.fill("NOT-A-CODE");
  await summary.getByRole("button", { name: "Apply" }).click();
  await expect(summary.getByRole("alert")).toHaveText("This code can’t be used with your cart.");
  await expect(total).toContainText("319.00 EUR");

  await code.fill("PERCENT10");
  await summary.getByRole("button", { name: "Apply" }).click();
  const applied = summary.getByRole("list", { name: "Applied discount codes" });
  await expect(applied).toContainText("PERCENT10");
  await expect(total).toContainText("287.10 EUR");
  await expect(summary.getByRole("alert")).toHaveCount(0);

  // The code is stored on the backend cart and survives a quantity change.
  await page.getByRole("region", { name: "Items in your cart" }).getByRole("button", { name: /increase/i }).click();
  await expect(total).toContainText("574.20 EUR");
  await expect(applied).toContainText("PERCENT10");

  await summary.getByRole("button", { name: "Remove code PERCENT10" }).click();
  await expect(applied).toHaveCount(0);
  await expect(total).toContainText("638.00 EUR");
});
