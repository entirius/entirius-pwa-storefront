// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// A search with no results has nothing to filter or sort: no filter panel, no Filters button. Under a chosen filter
// the panel stays, so the visitor can clear it.

test("desktop: a search without results shows no filter panel", async ({ page }) => {
  await page.goto("/search?q=zzzzqq");
  await expect(page.getByText("No results found.")).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Filters" })).toHaveCount(0);
  await expect(page.getByText("Price range")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Apply/ })).toHaveCount(0);
});

test("phone: a search without results has no Filters button", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/search?q=zzzzqq");
  await expect(page.getByText("No results found.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Filters" })).toHaveCount(0);
});

test("a filter with no matches keeps the panel to clear it", async ({ page }) => {
  await page.goto("/catalog/chairs?q_series=outpost-line");
  const panel = page.getByRole("complementary", { name: "Filters" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Clear all" })).toBeVisible();
});
