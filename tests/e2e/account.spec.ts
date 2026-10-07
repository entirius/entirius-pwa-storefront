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
  // The cart page syncs the backend cart.
  const cart_call = page.waitForResponse(
    (r) => r.url().includes("/api/checkout/v2/") && r.url().includes("/carts/"),
  );
  await page.locator("header").getByRole("link", { name: /^Cart, 1 item$/ }).click();
  const res = await cart_call;
  expect(res.ok()).toBe(true);
  expect(res.request().headers()["authorization"]).toMatch(/^Bearer \S+$/);
});

// Places an order: never run alongside another order-placing spec in the same
// instant (the backend numbers orders without a lock — see checkout-guest.spec.ts).
test("an order placed while logged in shows in my orders and its detail", async ({ page }) => {
  await login(page, email);
  await page.goto("/product/flight-deck-command-chair");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.locator("header").getByRole("link", { name: /^Cart, 1 item$/ }).click();
  await page.getByRole("complementary", { name: "Order summary" }).getByRole("link", { name: "Go to checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  const form = page.locator("form");
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("First name").fill("Olga");
  await form.getByLabel("Last name").fill("Orders");
  await form.getByLabel("Street and number").fill("Zamowien 3");
  await form.getByLabel("Postal code").fill("00-001");
  await form.getByLabel("City").fill("Warsaw");
  await form.getByRole("combobox", { name: "Country" }).click();
  await page.getByRole("option", { name: "Poland" }).click();
  await form.getByLabel("Phone number").fill("600100200");
  const to_shipping = page.getByRole("button", { name: "Continue to shipping" });
  await expect(to_shipping).toBeEnabled();
  await to_shipping.click();
  await page.getByRole("radiogroup").getByRole("radio").first().click();
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await page.getByRole("radiogroup").getByText(/bank transfer/i).click();
  await page.getByRole("button", { name: "Continue to review" }).click();

  const placed = page.waitForResponse(
    (r) => r.request().method() === "POST" && /\/orders\/?(\?|$)/.test(r.url()),
  );
  await page.getByRole("button", { name: "Place order" }).click();
  const response = await placed;
  expect(response.status()).toBe(201);
  const ref: string = (await response.json()).order_pretty_id;
  await expect(page).toHaveURL(`/checkout/success?ref=${ref}`);

  // My orders → the order card → its detail; both read checkout v2.
  await page.goto("/profile/orders");
  await expect(page.getByRole("heading", { name: "My orders" })).toBeVisible();
  const card = page.getByRole("link", { name: new RegExp(`#${ref}`) });
  await expect(card).toContainText("1 item");

  await card.click();
  await expect(page).toHaveURL(`/profile/orders/${ref}`);
  await expect(page.getByRole("heading", { name: `Order #${ref}` })).toBeVisible();
  await expect(page.getByText("Flight Deck Command Chair")).toBeVisible();
  await expect(page.getByText("Olga Orders").first()).toBeVisible();

  // Same time on the card and the detail (v1 used to send a zone-less UTC time,
  // which the list showed hours off).
  const placed_at = (await page.getByText(/^Placed /).innerText()).replace(/^Placed /, "");
  await page.goBack();
  await expect(card).toContainText(placed_at);
});
