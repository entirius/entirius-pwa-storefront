// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";

// The accounts limits (accounts 6.0.2: login, signup and the password reset mail per address and per e-mail) answer
// 429. The answers are stubbed: a real one would lock the whole suite out, as every call of it comes from one
// address. The login goes through the shop's /session/login, which passes the wait on as `retry_after`; signup and
// the reset mail go from the browser to the API, which exposes no Retry-After, so their message names no time.

const LATER = "Too many attempts. Please wait a few minutes and try again.";
// accounts' throttle envelope (django_accounts.utils.throttling.throttled_response)
const THROTTLED = { meta: { status: "ERR", message: "throttled" }, data: { detail: "Request was throttled." } };

async function open_sheet(page: Page) {
  await page.goto("/");
  const sheet = page.getByRole("dialog");
  // The header is server-rendered: a click before hydration does nothing, so click until the sheet is open.
  await expect(async () => {
    await page.locator("header").getByRole("button", { name: "Sign in" }).click({ timeout: 2_000 });
    await expect(sheet.getByLabel("Email")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  return sheet;
}

test("a throttled login says how many minutes to wait", async ({ page }) => {
  await page.route("**/session/login", (route) =>
    route.fulfill({ status: 429, json: { error: "throttled", retry_after: 900 } }),
  );
  const sheet = await open_sheet(page);
  await sheet.getByLabel("Email").fill("someone@example.com");
  await sheet.getByLabel("Password").fill("E2e-Throttle-2026!");
  await sheet.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(sheet.getByText("Too many attempts. Please try again in 15 minutes.")).toBeVisible();
  await expect(page).not.toHaveURL(/\/profile$/);
});

test("a throttled signup asks to wait instead of a generic failure", async ({ page }) => {
  await page.route(/\/customer\/signup\/(\?|$)/, (route) => route.fulfill({ status: 429, json: THROTTLED }));
  const sheet = await open_sheet(page);
  await sheet.getByRole("button", { name: "Register" }).click();
  await expect(sheet.getByRole("heading", { name: "Create account" })).toBeVisible();
  await sheet.getByLabel("Email").fill("someone@example.com");
  await sheet.getByLabel("Password", { exact: true }).fill("E2e-Throttle-2026!");
  await sheet.getByLabel("Confirm password").fill("E2e-Throttle-2026!");
  await sheet.getByLabel("I accept the terms of service and privacy policy.").check();
  await sheet.getByLabel("I consent to the processing of my personal data.").check();
  await sheet.getByRole("button", { name: "Create account" }).click();
  await expect(sheet.getByText(LATER)).toBeVisible();
  await expect(sheet.getByText("Could not create the account. Please try again.")).toHaveCount(0);
});

test("a throttled reset mail asks to wait and does not claim it was sent", async ({ page }) => {
  await page.route(/\/customer\/password\/reset\/(\?|$)/, (route) => route.fulfill({ status: 429, json: THROTTLED }));
  const sheet = await open_sheet(page);
  await sheet.getByRole("button", { name: "Forgot your password?" }).click();
  await expect(sheet.getByRole("heading", { name: "Reset password" })).toBeVisible();
  await sheet.getByLabel("Email").fill("someone@example.com");
  await sheet.getByRole("button", { name: "Send link" }).click();
  await expect(sheet.getByText(LATER)).toBeVisible();
  await expect(sheet.getByText("If an account exists for this email, we've sent it a link")).toHaveCount(0);
});
