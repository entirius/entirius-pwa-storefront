// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";
import { link_path, mail } from "./support/mail";

// Registration with the e-mail confirmation, as a customer goes through it: the
// form in the account sheet, the "Signup Confirmation" mail, its link to
// /user-handler, then signing in.

const PASSWORD = "E2e-Signup-2026!";

test("a new customer registers, confirms the e-mail and signs in", async ({ page, request }) => {
  const email = `e2e-signup-${Date.now()}@example.com`;

  await page.goto("/");
  await page.locator("header").getByRole("button", { name: "Sign in" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("button", { name: "Register" }).click();
  await expect(sheet.getByRole("heading", { name: "Create account" })).toBeVisible();
  await sheet.getByLabel("Email").fill(email);
  await sheet.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await sheet.getByLabel("Confirm password").fill(PASSWORD);
  await sheet.getByLabel("I accept the terms of service and privacy policy.").check();
  await sheet.getByLabel("I consent to the processing of my personal data.").check();
  await sheet.getByRole("button", { name: "Create account" }).click();
  await expect(sheet.getByText("Account created — check your email to confirm, then sign in.")).toBeVisible();

  const path = link_path(await mail(request, email, "Signup Confirmation"), "user-handler");
  expect(path, "activation link in the mail").not.toBeNull();
  await page.goto(path!);
  await expect(page.getByRole("heading", { name: "Verification complete" })).toBeVisible();

  await page.locator("header").getByRole("button", { name: "Sign in" }).click();
  await sheet.getByLabel("Email").fill(email);
  await sheet.getByLabel("Password").fill(PASSWORD);
  await sheet.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByText(email)).toBeVisible();
});

test("a broken activation link says the verification failed", async ({ page }) => {
  await page.goto("/user-handler?key=not-a-key&uid=00000000-0000-0000-0000-000000000000");
  await expect(page.getByRole("heading", { name: "Verification failed" })).toBeVisible();
});
