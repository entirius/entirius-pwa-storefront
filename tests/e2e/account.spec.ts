// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import app_config from "../../_CONFIG/app.config.json";

// Logged-in customer: login, profile, address book, token refresh, logout.
// Every run creates a fresh, active account through the accounts API (signup +
// the same activation call /user-handler makes), so no fixed credentials exist.

const ACCOUNTS = `${app_config.API_BASE_URL}/api/accounts/v1/default-europe/customer`;
const PASSWORD = "E2e-Account-2026!";

async function create_account(request: APIRequestContext): Promise<string> {
  const email = `e2e-account-${Date.now()}@example.com`;
  const signup = await request.post(`${ACCOUNTS}/signup/`, {
    data: {
      email,
      password: PASSWORD,
      agreements: { email: true, condition: true, newsletter: false },
      language: "en",
    },
  });
  expect(signup.ok(), await signup.text()).toBe(true);
  const { uid, confirmation_key } = (await signup.json()).data;
  const activate = await request.post(`${ACCOUNTS}/signup/${uid}/`, {
    params: { key: confirmation_key },
  });
  expect(activate.ok(), await activate.text()).toBe(true);
  return email;
}

async function login(page: Page, email: string) {
  await page.goto("/");
  await page.locator("header").getByRole("button", { name: "Sign in" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Email").fill(email);
  await sheet.getByLabel("Password").fill(PASSWORD);
  await sheet.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { name: "My account" })).toBeVisible();
}

test.describe.configure({ mode: "serial" });

let email: string;

test.beforeAll(async ({ request }) => {
  email = await create_account(request);
});

test("login opens the profile, logout returns to the sign-in sheet", async ({ page }) => {
  await login(page, email);
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.locator("header").getByRole("button", { name: "Sign in" })).toBeVisible();
  await page.goto("/profile");
  await expect(page.getByText(email)).toHaveCount(0);
});

test("profile edit: names are saved and survive a reload", async ({ page }) => {
  await login(page, email);
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("First name").fill("Edith");
  await page.getByLabel("Last name").fill("Profile");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Edith Profile")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Edith Profile")).toBeVisible();
});

test("address book: add, edit, set default, delete", async ({ page }) => {
  await login(page, email);
  await page.getByRole("link", { name: "Delivery addresses" }).click();
  await expect(page.getByRole("heading", { name: "Delivery addresses" })).toBeVisible();
  await expect(page.getByText("You have no saved addresses yet.")).toBeVisible();

  const add = async (first: string, street: string) => {
    await page.getByRole("button", { name: "Add address" }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByLabel("First name").fill(first);
    await sheet.getByLabel("Last name").fill("Tester");
    await sheet.getByLabel("Street and number").fill(street);
    await sheet.getByLabel("Postal code").fill("00-001");
    await sheet.getByLabel("City").fill("Warsaw");
    await sheet.getByLabel("Phone number").fill("500600700");
    await sheet.getByRole("button", { name: "Save address" }).click();
    await expect(sheet).toBeHidden();
  };

  const cards = page.getByRole("list", { name: "Saved addresses" }).getByRole("listitem");
  const card = (name: string) => cards.filter({ hasText: name });

  await add("Anna", "Main Street 1");
  await expect(card("Anna Tester")).toContainText("Main Street 1");
  await add("Bruno", "Side Street 2");
  await expect(cards).toHaveCount(2);

  // Edit
  await card("Anna Tester").getByRole("button", { name: "Edit address" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByLabel("Street and number")).toHaveValue("Main Street 1");
  await sheet.getByLabel("Street and number").fill("Main Street 10");
  await sheet.getByRole("button", { name: "Save address" }).click();
  await expect(sheet).toBeHidden();
  await expect(card("Anna Tester")).toContainText("Main Street 10");

  // Set default — exactly one card carries the badge, and it survives a reload.
  await card("Bruno Tester").getByRole("button", { name: "Set default" }).click();
  await expect(card("Bruno Tester")).toContainText("Default");
  await page.reload();
  await expect(card("Bruno Tester")).toContainText("Default");
  await expect(card("Anna Tester")).not.toContainText("Default");

  // Delete (window.confirm)
  page.once("dialog", (d) => d.accept());
  await card("Anna Tester").getByRole("button", { name: "Delete address" }).click();
  await expect(cards).toHaveCount(1);
  await page.reload();
  await expect(cards).toHaveCount(1);
  await expect(card("Bruno Tester")).toBeVisible();
});

test("an invalid access token is refreshed transparently", async ({ page, context }) => {
  await login(page, email);
  const at = (await context.cookies()).find((c) => c.name === "at");
  expect(at, "access token cookie").toBeTruthy();
  // Stand in for an expired token (access lives 5 min): the API answers 401,
  // the engine refreshes with `rt` and retries.
  await context.addCookies([{ ...at!, value: "expired.access.token" }]);

  const refreshed = page.waitForResponse((r) => r.url().includes("/customer/tokens/refresh/"));
  await page.reload();
  expect((await refreshed).ok()).toBe(true);
  await expect(page.getByText(email)).toBeVisible();
  const next = (await context.cookies()).find((c) => c.name === "at");
  expect(next?.value).not.toBe("expired.access.token");
});

test("cart requests carry the customer token after login", async ({ page }) => {
  await login(page, email);
  await page.goto("/product/docking-bay-chair");
  await page.getByRole("button", { name: "Add to cart" }).click();
  // The backend cart syncs while the drawer is open.
  const cart_call = page.waitForResponse(
    (r) => r.url().includes("/api/checkout/v2/") && r.url().includes("/carts/"),
  );
  await page.locator("header").getByRole("button", { name: /^Cart, 1 item$/ }).click();
  const res = await cart_call;
  expect(res.ok()).toBe(true);
  expect(res.request().headers()["authorization"]).toMatch(/^Bearer \S+$/);
});
