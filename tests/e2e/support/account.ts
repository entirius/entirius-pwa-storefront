// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, type APIRequestContext, type Page } from "@playwright/test";
import app_config from "../../../_CONFIG/app.config.json";
import channels from "../../../_CONFIG/channels.config.json";

// A fresh, active customer per spec: signup through the accounts API plus the
// activation call /user-handler makes, so no fixed credentials exist.

export const ACCOUNTS = `${app_config.API_BASE_URL}/api/accounts/v1/default-europe/customer`;
export const PASSWORD = "E2e-Account-2026!";

export async function create_account(request: APIRequestContext): Promise<string> {
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

export async function login(page: Page, email: string) {
  await page.goto("/");
  await page.locator("header").getByRole("button", { name: "Sign in" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Email").fill(email);
  await sheet.getByLabel("Password").fill(PASSWORD);
  await sheet.getByRole("button", { name: "Sign in", exact: true }).click();
  // Login waits for the cart merge (carts/latest/ is recomputed on every read, ~2 s while the whole
  // suite loads the backend) before it moves to the profile.
  await expect(page).toHaveURL(/\/profile$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "My account" })).toBeVisible();
}

const CHECKOUT = `${app_config.API_BASE_URL}/api/checkout/v2/default-europe`;
const CHECKOUT_KEY = channels["default-europe"].API_CHECKOUT_KEY;

// A cart the customer saved earlier (another device): created with the customer's token, so the
// backend binds it to the account.
export async function save_customer_cart(
  request: APIRequestContext,
  email: string,
  items: { sku: string; quantity: number }[],
) {
  const tokens = await request.post(`${ACCOUNTS}/tokens/`, { data: { email, password: PASSWORD } });
  expect(tokens.ok(), await tokens.text()).toBe(true);
  const { access } = (await tokens.json()).data;
  const cart = await request.post(`${CHECKOUT}/carts/`, {
    headers: { "x-api-key": CHECKOUT_KEY, Authorization: `Bearer ${access}` },
    data: { items, currency_code: "EUR" },
  });
  expect(cart.ok(), await cart.text()).toBe(true);
}
