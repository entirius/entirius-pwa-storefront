// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { test, expect } from "@playwright/test";

// A theme overrides a component by a file at the same path: tests/theme-example ships its own
// components/product-card.tsx and its colour in tokens.css. Runs only with that theme installed (`pnpm test:e2e:theme`).
test.skip(process.env.E2E_THEME !== "example", "needs the test theme at theme/: pnpm test:e2e:theme");

test("the theme's product card replaces the default one in the listing", async ({ page }) => {
  await page.goto("/catalog/chairs");
  const cards = page.locator("[data-product-tile]");
  await expect(cards.first()).toBeVisible();
  const count = await cards.count();
  await expect(page.locator("[data-theme-example-card]")).toHaveCount(count);
  // A class only the theme uses: Tailwind scanned theme/.
  await expect(page.locator("[data-theme-example-picture]").first()).toHaveCSS("aspect-ratio", "1 / 1");
});

test("the rest of the product page stays the default theme's", async ({ page }) => {
  await page.goto("/product/nebula-crimson-sofa");
  await expect(page.locator("[data-product-page]")).toBeVisible();
  await expect(page.locator("[data-gallery]")).toBeVisible();
  await expect(page.locator("[data-buy-area]")).toBeVisible();
  // The theme's tokens.css comes after the default look: its primary colour is on the buy button.
  await expect(page.locator("[data-buy-area]").getByRole("button", { name: "Add to cart" })).toHaveCSS(
    "background-color",
    "rgb(122, 31, 92)",
  );
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Similar products are product cards too: the theme's.
  const related = page.locator("[data-related-products] [data-product-tile]");
  await expect(related.first()).toBeVisible();
  await expect(page.locator("[data-related-products] [data-theme-example-card]")).toHaveCount(await related.count());
});
