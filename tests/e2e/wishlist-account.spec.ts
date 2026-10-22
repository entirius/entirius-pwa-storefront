// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";
import { create_account, login } from "./support/account";
import { account_wishlist, save_wishlist } from "./support/wishlist";

// The wishlist on the account: what another device saved shows here after sign-in, together with what this
// device saved as a guest; "Move to cart" puts one unit into the cart and takes the product off the list (on the
// account too); signing out empties the device's list.

test("the account keeps the wishlist across devices and sign-ins", async ({ page, request }) => {
  const email = await create_account(request);
  // Another device saved the chair.
  await save_wishlist(request, email, ["ENT-C001"]);

  // A guest saves a sofa on this device, then signs in.
  await page.goto("/catalog/sofas");
  await page
    .locator("[data-product-tile]", { hasText: "Orion Command Sofa" })
    .getByRole("button", { name: "Add to wishlist" })
    .click();
  await login(page, email);

  const header = page.locator("header");
  await header.getByRole("button", { name: "Wishlist, 2 items" }).click();
  const drawer = page.getByRole("dialog", { name: "Wishlist" });
  await expect(drawer).toContainText("Flight Deck Command Chair");
  await expect(drawer).toContainText("Orion Command Sofa");
  expect(await account_wishlist(request, email)).toEqual(["ENT-C001", "ENT-S001"]);

  await drawer.getByRole("button", { name: "Move Flight Deck Command Chair to cart" }).click();
  await expect(drawer).not.toContainText("Flight Deck Command Chair");
  await expect.poll(() => account_wishlist(request, email)).toEqual(["ENT-S001"]);
  // The open drawer hides the page from assistive tech: the header counts once it is closed.
  await page.keyboard.press("Escape");
  await expect(header.getByRole("link", { name: "Cart, 1 item" })).toBeVisible();

  // A reload takes the list from the account.
  await page.evaluate(() => localStorage.removeItem("WL"));
  await page.reload();
  await expect(header.getByRole("button", { name: "Wishlist, 1 item" })).toBeVisible();

  // Signing out leaves nothing of the account's list on the device.
  await page.goto("/profile");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(header.getByRole("button", { name: "Wishlist", exact: true })).toBeVisible();
});
