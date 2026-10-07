// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// EU Omnibus: every reduced price carries the lowest price of the 30 days before
// the reduction, and only reduced prices do. Seeded products:
// observation-deck-lounge-chair (689.00 → 499.00), flight-deck-command-chair
// (regular price).

const NOTE = /^Lowest price in the 30 days before the discount: \d+\.\d{2} EUR$/;
const NOTE_COMPACT = /^Lowest 30-day price: \d+\.\d{2} EUR$/;
const is_omnibus = (url: string) => /\/omnibus\/\?/.test(url);

test("reduced product shows the Omnibus price in the server HTML", async ({ request }) => {
  const html = await (await request.get("/product/observation-deck-lounge-chair")).text();
  expect(html).toMatch(/Lowest price in the 30 days before the discount: \d+\.\d{2} EUR/);
});

test("reduced product page shows the Omnibus price", async ({ page }) => {
  await page.goto("/product/observation-deck-lounge-chair");
  await expect(page.getByText(NOTE)).toBeVisible();
});

test("regular price has no Omnibus line", async ({ page }) => {
  await page.goto("/product/flight-deck-command-chair");
  await expect(page.getByText("549.00 EUR")).toBeVisible();
  await expect(page.getByText(/Lowest/)).toHaveCount(0);
});

test("every reduced tile in the catalog has its Omnibus line, without browser requests", async ({ page }) => {
  const calls: string[] = [];
  page.on("request", (r) => is_omnibus(r.url()) && calls.push(r.url()));
  await page.goto("/catalog/chairs");
  const tiles = page.locator('a[href^="/product/"]');
  await expect(tiles.first()).toBeVisible();

  const reduced = tiles.filter({ has: page.locator(".line-through") });
  const count = await reduced.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(reduced.nth(i).getByText(NOTE)).toBeVisible();
  }
  await expect(tiles.filter({ hasText: /Lowest/ })).toHaveCount(count);
  // Prefetched on the server for the whole page.
  expect(calls).toEqual([]);
});

test("search results batch the Omnibus lookup into one request", async ({ page }) => {
  // A page without products: the home page's product sections already hold the
  // Omnibus prices of its sale items, which the search would then reuse.
  await page.goto("/about");
  const calls: string[] = [];
  page.on("request", (r) => is_omnibus(r.url()) && calls.push(r.url()));
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search products and categories…").fill("chair");
  const row = page.locator('a[href="/product/observation-deck-lounge-chair"]');
  await expect(row.getByText(NOTE_COMPACT)).toBeVisible();
  expect(calls).toHaveLength(1);
});
