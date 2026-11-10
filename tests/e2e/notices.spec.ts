// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";
import { login, test_account } from "./support/account";

// Short notices under the header (stores/notices.store.ts). The failures are stubbed: the wishlist write of a
// signed-in customer and the stock call of the "+" on a product tile.

const WISHLIST_WRITE = /\/accounts\/v1\/[^/]+\/wishlist\/product\//;
const STOCK = /\/matrix\/v2\/[^/]+\/stock\//;
const SOFA = "Orion Command Sofa";

const sofa_tile = (page: Page) =>
  page.locator("[data-product-tile]", { hasText: SOFA });

test("saving to the wishlist says so and opens the list", async ({ page }) => {
  await page.goto("/catalog/sofas");
  await sofa_tile(page).getByRole("button", { name: "Add to wishlist" }).click();

  const saved = page.getByRole("status").filter({ hasText: "Saved to your wishlist" });
  await expect(saved).toBeVisible();
  await saved.getByRole("button", { name: "View wishlist" }).click();

  await expect(page.getByRole("dialog", { name: "Wishlist" })).toContainText(SOFA);
  await expect(saved).toBeHidden();
});

test("a notice closes on Close", async ({ page }) => {
  await page.goto("/catalog/sofas");
  await sofa_tile(page).getByRole("button", { name: "Add to wishlist" }).click();
  const saved = page.getByRole("status").filter({ hasText: "Saved to your wishlist" });
  await saved.getByRole("button", { name: "Close" }).click();
  await expect(saved).toBeHidden();
});

test("a wishlist save the account refuses is undone and explained", async ({ page, request }) => {
  const email = await test_account(request, "notices", { wishlist: true });
  await login(page, email);
  await page.route(WISHLIST_WRITE, (route) =>
    route.request().method() === "GET" ? route.continue() : route.fulfill({ status: 500, json: {} }),
  );

  await page.goto("/catalog/sofas");
  const heart = sofa_tile(page).getByRole("button", { name: "Add to wishlist" });
  await heart.click();

  await expect(page.getByRole("alert").filter({ hasText: "Couldn’t update your wishlist. Please try again." })).toBeVisible();
  await expect(heart).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText("Saved to your wishlist")).toBeHidden();
});

test("a failed quick add says so and leaves the cart as it was", async ({ page }) => {
  await page.goto("/catalog/sofas");
  await page.route(STOCK, (route) => route.abort());

  await sofa_tile(page).getByRole("button", { name: `Add ${SOFA} to cart` }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: `Couldn’t add ${SOFA} to cart. Please try again.` }),
  ).toBeVisible();
  await expect(page.getByText(`${SOFA} added to cart`)).toBeHidden();
  await expect(page.locator("header").getByRole("link", { name: "Cart", exact: true })).toBeVisible();
});
