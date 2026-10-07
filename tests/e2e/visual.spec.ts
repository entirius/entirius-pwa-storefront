// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";

// Visual regression for the key screens. Baselines live next to this file
// (`visual.spec.ts-snapshots/`) and are per platform — Playwright appends the OS to
// the name. Rendering differs between macOS and Linux, so a new platform records
// its own baseline first: `pnpm test:e2e visual --update-snapshots`.
//
// Product photos are masked: they come from the backend media store and decode at
// their own pace, while what this guards is the brand layer around them (layout,
// tokens, typography). Prices and names come from the seeded reference dataset.

const SHOT = {
  animations: "disabled",
  // Per-pixel color tolerance. The default (0.2) lets neighbouring brand shades
  // through — accent vs accent-fill, basic-700 vs basic-750 — which is exactly the
  // regression this guards. Rendering here is pixel-exact run to run.
  threshold: 0.02,
  maxDiffPixels: 100, // antialiasing noise after a Chrome update, not a token change
} as const;

async function settle(page: Page) {
  // Dev-only overlays (Next.js indicator, TanStack Query devtools) are not the shop.
  await page.addStyleTag({
    content: "nextjs-portal, .tsqd-parent-container { display: none !important; }",
  });
  await page.evaluate(() => document.fonts.ready);
}

const shot = (page: Page, name: string) =>
  expect(page).toHaveScreenshot(name, { ...SHOT, mask: [page.locator("main img")] });

test("home", async ({ page }) => {
  await page.goto("/");
  await settle(page);
  await shot(page, "home.png");
});

test("catalog", async ({ page }) => {
  await page.goto("/catalog/chairs");
  await expect(page.locator('a[href^="/product/"]').first()).toBeVisible();
  await settle(page);
  await shot(page, "catalog.png");
});

test("product page", async ({ page }) => {
  await page.goto("/product/flight-deck-command-chair");
  await expect(page.getByRole("button", { name: "Add to cart" })).toBeEnabled();
  await settle(page);
  await shot(page, "product.png");
});

test("cart", async ({ page }) => {
  await page.goto("/product/flight-deck-command-chair");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.locator("header").getByRole("button", { name: /^Cart, 1 item$/ }).click();
  const cart = page.getByRole("dialog");
  await expect(cart).toContainText("Flight Deck Command Chair");
  // Totals arrive from the backend cart sync; the shot waits for the final layout.
  await expect(cart).toContainText(/incl\. VAT/);
  // Adding to cart can leave the (now long) product page scrolled a little;
  // the shot is about the drawer, so pin the page behind it to the top.
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page);
  await expect(page).toHaveScreenshot("cart.png", { ...SHOT, mask: [page.locator("img")] });
});
