// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, type APIRequestContext, type Page } from "@playwright/test";
import app_config from "../../../_CONFIG/app.config.json";
import channels from "../../../_CONFIG/channels.config.json";
import { link_path, mail } from "./mail";

// A fresh, active customer per spec: signup through the accounts API plus the
// activation call /user-handler makes, with the link from the signup mail (needs zeno `make mail`),
// so no fixed credentials exist.

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
  // The key reaches the customer only in the mail (django-accounts 6.0.1), so read it the way a customer would.
  const link = link_path(await mail(request, email, "Signup Confirmation"), "user-handler");
  expect(link, "confirmation link in the signup mail").toBeTruthy();
  const query = new URL(link!, "http://mail.local").searchParams;
  const activate = await request.post(`${ACCOUNTS}/signup/${query.get("uid")}/`, {
    params: { key: query.get("key")! },
  });
  expect(activate.ok(), await activate.text()).toBe(true);
  return email;
}

export async function login(page: Page, email: string) {
  await page.goto("/");
  const sheet = page.getByRole("dialog");
  // The header is server-rendered: a click before hydration does nothing (a busy dev server hydrates late), so
  // click until the sheet is open.
  await expect(async () => {
    await page.locator("header").getByRole("button", { name: "Sign in" }).click({ timeout: 2_000 });
    await expect(sheet.getByLabel("Email")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await sheet.getByLabel("Email").fill(email);
  await sheet.getByLabel("Password").fill(PASSWORD);
  await sheet.getByRole("button", { name: "Sign in", exact: true }).click();
  // Login waits for the cart merge (carts/latest/ is recomputed on every read, ~2 s while the whole
  // suite loads the backend) before it moves to the profile.
  await expect(page).toHaveURL(/\/profile$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "My account" })).toBeVisible();
}

const CHECKOUT = `${app_config.API_BASE_URL}/api/checkout/v2/default-europe`;
const CHECKOUT_KEY = (channels as Record<string, { API_CHECKOUT_KEY: string }>)["default-europe"].API_CHECKOUT_KEY;

async function customer_token(request: APIRequestContext, email: string) {
  const tokens = await request.post(`${ACCOUNTS}/tokens/`, { data: { email, password: PASSWORD } });
  expect(tokens.ok(), await tokens.text()).toBe(true);
  const { access, customer_id } = (await tokens.json()).data;
  return { headers: { Authorization: `Bearer ${access}` }, addresses: `${ACCOUNTS}/${customer_id}/addresses/` };
}

export type BookAddress = {
  firstname: string;
  lastname: string;
  street: string;
  city: string;
  postcode: string;
  country_code: string;
  dialling_code: string;
  telephone: string;
  is_company: boolean;
  company: string | null;
  tax_id: string | null;
};

// An address-book entry of the customer, through the accounts API; returns its id.
export async function save_address(request: APIRequestContext, email: string, address: BookAddress) {
  const { headers, addresses } = await customer_token(request, email);
  const before = await request.get(addresses, { headers });
  const known = new Set(Object.keys((await before.json()).data ?? {}));
  const saved = await request.put(addresses, { headers, data: address });
  expect(saved.ok(), await saved.text()).toBe(true);
  const after = await request.get(addresses, { headers });
  const id = Object.keys((await after.json()).data ?? {}).find((key) => !known.has(key));
  expect(id, "new address id").toBeTruthy();
  return id!;
}

// The default billing and shipping address of the customer.
export async function set_default_address(request: APIRequestContext, email: string, id: string) {
  const { headers, addresses } = await customer_token(request, email);
  const res = await request.post(`${addresses}defaults/`, {
    headers,
    data: { billing_address: id, shipping_address: id },
  });
  expect(res.ok(), await res.text()).toBe(true);
}

// A cart the customer saved earlier (another device): created with the customer's token, so the
// backend binds it to the account.
export async function save_customer_cart(
  request: APIRequestContext,
  email: string,
  items: { sku: string; quantity: number }[],
) {
  const { headers } = await customer_token(request, email);
  const cart = await request.post(`${CHECKOUT}/carts/`, {
    headers: { "x-api-key": CHECKOUT_KEY, ...headers },
    data: { items, currency_code: "EUR" },
  });
  expect(cart.ok(), await cart.text()).toBe(true);
}
