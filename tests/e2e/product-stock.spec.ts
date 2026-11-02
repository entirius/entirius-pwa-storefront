// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// The stock lookup runs in the browser after the product renders. While it is in
// flight the button must not claim "Out of stock". The response is delayed, not
// replaced — the backend still answers.

test("an in-stock product never shows Out of stock while stock loads", async ({ page }) => {
  await page.route(/\/stock\/\?/, async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  const seen: string[] = [];
  await page.exposeFunction("report_label", (t: string) => seen.push(t));
  await page.addInitScript(() => {
    new MutationObserver(() => {
      if (document.body?.innerText.includes("Out of stock"))
        (window as unknown as { report_label: (t: string) => void }).report_label("Out of stock");
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });

  await page.goto("/product/docking-bay-chair");
  await expect(page.getByRole("button", { name: "Add to cart" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Add to cart" })).toBeEnabled();
  expect(seen).toEqual([]);
});

// Only the real-time stock opens the button: with `stock/` down, neither a simple product nor a variant can be
// bought on the read model's `on_stock` alone.
for (const [kind, path, sku] of [
  ["simple product", "/product/docking-bay-chair", "ENT-C002"],
  ["variant", "/product/captains-living-room-set?variant=ENT-C001", "ENT-C001"],
] as const) {
  test(`a ${kind} cannot be bought while the stock call fails`, async ({ page }) => {
    let failed = 0;
    await page.route(/\/stock\/\?/, (route) => {
      if (route.request().url().includes(sku)) failed += 1;
      return route.fulfill({ status: 500, body: "{}" });
    });
    await page.goto(path);
    const button = page.locator("[data-buy-area]").getByRole("button", { name: "Add to cart" });
    await expect(button).toBeDisabled();
    // The first call and the query's three retries have all failed: the button still does not open.
    await expect.poll(() => failed, { timeout: 15_000 }).toBeGreaterThanOrEqual(4);
    await expect(button).toBeDisabled();
  });
}

// The stock answer, not the read model, says sold out: the variant's button names it.
test("a variant the stock reports sold out cannot be bought", async ({ page }) => {
  await page.route(/\/stock\/\?/, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) }),
  );
  await page.goto("/product/captains-living-room-set?variant=ENT-C001");
  await expect(page.locator("[data-buy-area]").getByRole("button", { name: "Out of stock" })).toBeDisabled();
});
