// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";

// The cancel link of the back-in-stock mails: /stock-alert/cancel?token=. The API is answered here: 200 for the good
// token, 400 for any other.

const CANCEL = /\/stock-alerts\/v2\/[^/]+\/subscriptions\/cancel\/$/;

async function cancel_api(page: Page) {
  const tokens: string[] = [];
  await page.route(CANCEL, (route) => {
    const { token } = route.request().postDataJSON() as { token: string };
    tokens.push(token);
    return token === "good"
      ? route.fulfill({ json: { status: "cancelled" } })
      : route.fulfill({ status: 400, json: { error: "VALIDATION_ERROR" } });
  });
  return tokens;
}

test("a good token cancels the request, with one call", async ({ page }) => {
  const tokens = await cancel_api(page);
  await page.goto("/stock-alert/cancel?token=good");
  await expect(page.locator('[data-stock-alert-cancel="cancelled"] h1')).toHaveText("Your request was cancelled");
  await expect(page.getByRole("link", { name: "Back to the shop" })).toBeVisible();
  await page.waitForTimeout(500);
  expect(tokens).toEqual(["good"]);
});

test("a bad token says the link does not work", async ({ page }) => {
  const tokens = await cancel_api(page);
  await page.goto("/stock-alert/cancel?token=bad");
  await expect(page.locator('[data-stock-alert-cancel="failed"] h1')).toHaveText("This link does not work any more");
  expect(tokens).toEqual(["bad"]);
});

test("no token: no call, the link does not work", async ({ page }) => {
  const tokens = await cancel_api(page);
  await page.goto("/stock-alert/cancel");
  await expect(page.locator('[data-stock-alert-cancel="failed"]')).toBeVisible();
  expect(tokens).toEqual([]);
});

test("the page is not indexed", async ({ page }) => {
  await cancel_api(page);
  await page.goto("/stock-alert/cancel?token=good");
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
