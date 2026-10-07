// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// Merchandising labels from the backend `badges` and the percentage off a special
// price. Seeded: zero-g-recliner (bestseller "Crew Favorite", 829.00 → 689.00),
// borealis-frontier-sofa (sale "Cargo Clearance", 1749.00 → 1299.00),
// flight-deck-command-chair (neither).

test("product page shows the labels and the percentage off", async ({ page }) => {
  await page.goto("/product/zero-g-recliner");
  // The product's own labels; the "More chairs" cards below carry theirs.
  const labels = page.getByRole("region", { name: "Product details" }).getByRole("list", { name: "Product labels" });
  await expect(labels.getByRole("listitem")).toHaveText(["−17%", "Crew Favorite"]);
});

test("catalog tile carries its labels", async ({ page }) => {
  await page.goto("/catalog/sofas");
  const tile = page.locator('a[href="/product/borealis-frontier-sofa"]');
  await expect(tile.getByRole("list", { name: "Product labels" }).getByRole("listitem")).toHaveText([
    "−26%",
    "Cargo Clearance",
  ]);
});

test("a product without labels or a reduction shows none", async ({ page }) => {
  await page.goto("/catalog/chairs");
  const tile = page.locator('a[href="/product/flight-deck-command-chair"]');
  await expect(tile).toBeVisible();
  await expect(tile.getByRole("list", { name: "Product labels" })).toHaveCount(0);
});
