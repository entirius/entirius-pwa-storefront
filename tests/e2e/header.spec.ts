// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// Every header control has an accessible name, and the cart/wishlist names
// carry the item count — screen readers otherwise announce a bare "button".

test("every header button and link has an accessible name", async ({ page }) => {
  await page.goto("/catalog/chairs");
  const header = page.locator("header");
  const controls = header.locator("button, a");
  await expect(controls.first()).toBeVisible();

  const unnamed = await controls.evaluateAll((nodes) =>
    nodes
      .filter((n) => (n as HTMLElement).offsetParent !== null) // visible only
      .filter((n) => {
        const label = n.getAttribute("aria-label")?.trim();
        const text = (n as HTMLElement).innerText.trim();
        const img_alt = n.querySelector("img[alt]")?.getAttribute("alt")?.trim();
        return !label && !text && !img_alt;
      })
      .map((n) => n.outerHTML.slice(0, 120)),
  );
  expect(unnamed).toEqual([]);

  for (const name of ["Search", "Wishlist"]) {
    await expect(header.getByRole("button", { name, exact: true })).toBeVisible();
  }
  await expect(header.getByRole("link", { name: "Cart", exact: true })).toBeVisible();
});

test("cart link name carries the item count and opens the cart page", async ({ page }) => {
  await page.goto("/product/flight-deck-command-chair");
  await page.getByRole("button", { name: "Add to cart" }).click();

  const cart = page.locator("header").getByRole("link", { name: /^Cart, 1 item$/ });
  await expect(cart).toBeVisible();
  await cart.click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole("region", { name: "Items in your cart" })).toContainText("Flight Deck Command Chair");
});

test("adding to the cart shows a notice with the product and the way on", async ({ page }) => {
  await page.goto("/product/flight-deck-command-chair");
  await page.getByRole("button", { name: "Add to cart" }).click();
  const notice = page.getByRole("status").filter({ hasText: "Added to your cart" });
  await expect(notice).toContainText("Flight Deck Command Chair");
  await expect(notice).toContainText("Cart: 1 item");
  await notice.getByRole("link", { name: "View cart" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(notice).toHaveCount(0);
});
