// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";
import { create_account, login, save_customer_cart } from "./support/account";

// Signing in joins the guest's cart with the cart the customer saved earlier (a
// SKU in both gets the sum); signing out takes the cart off the device and the
// next sign-in brings it back. No order is placed, so no stock is used.

const cart_link = (page: Page) => page.locator("header").getByRole("link", { name: /^Cart/ });

async function add_to_cart(page: Page, url_key: string) {
  await page.goto(`/product/${url_key}`);
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Added to your cart" })).toBeVisible();
}

test("the guest cart joins the saved cart on login and comes back after logout", async ({ page, request }) => {
  // Two logins, each waiting for the cart merge, and several backend cart recalculations.
  test.slow();
  const email = await create_account(request);
  await save_customer_cart(request, email, [{ sku: "ENT-C002", quantity: 2 }]);

  await add_to_cart(page, "flight-deck-command-chair");
  await add_to_cart(page, "docking-bay-chair");
  // The cart page syncs the guest cart to the backend (the `cid` the merge closes);
  // the total carries an amount once the backend answered.
  await page.goto("/cart");
  await expect(page.getByRole("complementary", { name: "Order summary" })).toContainText(/Total.*€/);
  await expect(cart_link(page)).toHaveAccessibleName("Cart, 2 items");

  await login(page, email);
  await expect(cart_link(page)).toHaveAccessibleName("Cart, 4 items");
  await page.goto("/cart");
  const lines = page.getByRole("region", { name: "Items in your cart" });
  await expect(lines).toContainText("Flight Deck Command Chair");
  await expect(lines).toContainText("Docking Bay Chair");
  // Wait for the merged cart to reach the customer's backend cart.
  await expect(page.getByRole("complementary", { name: "Order summary" })).toContainText(/Total.*€/);

  await page.goto("/profile");
  await page.getByRole("button", { name: "Log out" }).click();
  // Logout sends the app home itself; let that navigation finish before the next login.
  await expect(page).toHaveURL(/\/$/);
  await expect(cart_link(page)).toHaveAccessibleName("Cart");

  await login(page, email);
  await expect(cart_link(page)).toHaveAccessibleName("Cart, 4 items");
});
