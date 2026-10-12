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
