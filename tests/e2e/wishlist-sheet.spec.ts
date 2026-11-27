// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// The wishlist sheet lives in the header, which stays across pages: a product opened from the list used to leave
// the sheet open over the new page while the page scrolled to its top behind the overlay.
test("opening a product from the wishlist sheet closes the sheet", async ({ page }) => {
  await page.goto("/catalog/sofas");
  await page
    .locator("[data-product-tile]", { hasText: "Orion Command Sofa" })
    .getByRole("button", { name: "Add to wishlist" })
    .click();
  await page.locator("header").getByRole("button", { name: "Wishlist, 1 item" }).click();

  const drawer = page.getByRole("dialog", { name: "Wishlist" });
  await drawer.getByRole("link", { name: /Orion Command Sofa/ }).click();

  await expect(page).toHaveURL(/\/product\//);
  await expect(drawer).toBeHidden();
});
