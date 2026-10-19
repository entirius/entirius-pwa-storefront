// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";
import { PASSWORD, create_account, login } from "./support/account";
import { link_path, mail } from "./support/mail";

// Forgotten and changed passwords on a fresh account per test: the "Forgot your password?" view of the
// account sheet, the "Password Reset Confirmation" mail and its link to /reset-password, and the
// password card of the profile. The backend builds the reset link from RESET_PASSWORD_REDIRECT_URL.

const NEW_PASSWORD = "E2e-Reset-2026!!";
const SENT = "If an account exists for this email, we've sent it a link to set a new password.";

async function open_forgot(page: Page) {
  await page.goto("/");
  await page.locator("header").getByRole("button", { name: "Sign in" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("button", { name: "Forgot your password?" }).click();
  await expect(sheet.getByRole("heading", { name: "Reset password" })).toBeVisible();
  return sheet;
}

async function sign_in(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.locator("header").getByRole("button", { name: "Sign in" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Email").fill(email);
  await sheet.getByLabel("Password").fill(password);
  await sheet.getByRole("button", { name: "Sign in", exact: true }).click();
  return sheet;
}

test("a customer resets a forgotten password from the mail and signs in with it", async ({ page, request }) => {
  const email = await create_account(request);

  const sheet = await open_forgot(page);
  await sheet.getByLabel("Email").fill(email);
  await sheet.getByRole("button", { name: "Send link" }).click();
  await expect(sheet.getByText(SENT)).toBeVisible();
  await expect(sheet.getByRole("heading", { name: "Sign in" })).toBeVisible();

  const path = link_path(await mail(request, email, "Password Reset Confirmation"), "reset-password");
  expect(path, "reset link in the mail").not.toBeNull();
  await page.goto(path!);
  await expect(page.getByRole("heading", { name: "Set a new password" })).toBeVisible();
  // The form holds the registration rules, so a weak password never reaches the backend.
  await page.getByLabel("New password", { exact: true }).fill("weak");
  await page.getByLabel("Confirm new password").fill("weak");
  await page.getByRole("button", { name: "Set password" }).click();
  await expect(page.getByText("At least 8 characters", { exact: true })).toBeVisible();

  await page.getByLabel("New password", { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel("Confirm new password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Set password" }).click();
  await expect(page.getByRole("heading", { name: "Password changed" })).toBeVisible();

  await sign_in(page, email, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/profile$/, { timeout: 15_000 });
  await expect(page.getByText(email)).toBeVisible();
});

test("asking for a reset of an unknown e-mail looks the same as for a known one", async ({ page }) => {
  const sheet = await open_forgot(page);
  await sheet.getByLabel("Email").fill(`e2e-nobody-${Date.now()}@example.com`);
  await sheet.getByRole("button", { name: "Send link" }).click();
  await expect(sheet.getByText(SENT)).toBeVisible();
});

test("a broken reset link says it does not work", async ({ page }) => {
  await page.goto("/reset-password?key=not-a-key");
  await page.getByLabel("New password", { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel("Confirm new password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Set password" }).click();
  await expect(page.getByRole("heading", { name: "This link does not work" })).toBeVisible();

  await page.goto("/reset-password");
  await expect(page.getByRole("heading", { name: "This link does not work" })).toBeVisible();
});

test("a signed-in customer changes the password in the profile", async ({ page, request, context }) => {
  const email = await create_account(request);
  await login(page, email);

  const card = page.getByRole("region", { name: "Password" });
  await card.getByRole("button", { name: "Change password" }).click();
  await card.getByLabel("Current password").fill("Not-The-Password-1!!");
  await card.getByLabel("New password", { exact: true }).fill(NEW_PASSWORD);
  await card.getByLabel("Confirm new password").fill(NEW_PASSWORD);
  await card.getByRole("button", { name: "Change password" }).click();
  await expect(card.getByText("The current password is incorrect.")).toBeVisible();

  await card.getByLabel("Current password").fill(PASSWORD);
  await card.getByRole("button", { name: "Change password" }).click();
  await expect(card.getByText("Your password has been changed.")).toBeVisible();

  await context.clearCookies();
  const sheet = await sign_in(page, email, PASSWORD);
  await expect(sheet.getByText("Incorrect email or password.")).toBeVisible();
  await sign_in(page, email, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/profile$/, { timeout: 15_000 });
});
