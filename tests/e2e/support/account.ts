// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, type APIRequestContext, type Page } from "@playwright/test";
import app_config from "../../../_CONFIG/app.config.json";
import channels from "../../../_CONFIG/channels.config.json";
import { dummy_login_defaults } from "../../../utils/validation/auth.schema";
import { link_path, mail, mail_count } from "./mail";

// The customers of the specs. Signup is limited (accounts 6.0.2: 10 an hour per address, and every call of the
// suite comes from one address), so a spec does not sign up a customer of its own on every run:
// - `test_account(name)`: a fixed customer per spec, `e2e-<name>@example.com`, signed up (and activated with the
//   link of its signup mail, needs zeno `make mail`) only while it does not exist: on a fresh database, after a
//   reseed;
// - `demo_account()`: the demo customer of manual checks (the DEBUG login form's prefill); not in the seed, so it
//   is signed up the same way when missing;
// - `fresh_account()`: a new customer, for the one spec a fixed one cannot serve (the reset mail is limited to 3 an
//   hour per e-mail).
// What a spec changes stays on the account, so it starts by resetting it (`Reset`), never by cleaning up at its end:
// a run stopped half-way would leave the mess to the next one. Two specs never share an account, since the two
// workers run specs side by side. A run signs up three customers: signup.spec and newsletter.spec through the form,
// password.spec's reset through fresh_account().

export const ACCOUNTS = `${app_config.API_BASE_URL}/api/accounts/v1/default-europe/customer`;
export const WISHLIST = ACCOUNTS.replace(/\/customer$/, "/wishlist/");
export const PASSWORD = "E2e-Account-2026!";
export const DEMO_EMAIL = dummy_login_defaults.email;

const CHECKOUT = `${app_config.API_BASE_URL}/api/checkout/v2/default-europe`;
const CHECKOUT_KEY = (channels as Record<string, { API_CHECKOUT_KEY: string }>)["default-europe"].API_CHECKOUT_KEY;

export function password_of(email: string) {
  return email === DEMO_EMAIL ? dummy_login_defaults.password : PASSWORD;
}

type Session = { headers: { Authorization: string }; customer_id: string };

function tokens(request: APIRequestContext, email: string, password: string) {
  return request.post(`${ACCOUNTS}/tokens/`, { data: { email, password } });
}

async function session_of(answer: Awaited<ReturnType<typeof tokens>>): Promise<Session> {
  expect(answer.ok(), await answer.text()).toBe(true);
  const { access, customer_id } = (await answer.json()).data;
  return { headers: { Authorization: `Bearer ${access}` }, customer_id: String(customer_id) };
}

// API sign-ins count against the accounts login limit (30 a minute per address, shared by the whole suite and its
// sign-in forms), so a worker signs a customer in once and keeps the access token for 4 of its 5 minutes.
const sessions = new Map<string, { at: number; session: Session }>();

async function session(request: APIRequestContext, email: string): Promise<Session> {
  const kept = sessions.get(email);
  if (kept && Date.now() - kept.at < 4 * 60_000) return kept.session;
  const fresh = await session_of(await tokens(request, email, password_of(email)));
  sessions.set(email, { at: Date.now(), session: fresh });
  return fresh;
}

// The customer's Authorization header, for the other helpers (wishlist).
export async function customer_auth(request: APIRequestContext, email: string) {
  return (await session(request, email)).headers;
}

// A new customer, `e2e-<what>-<time>@example.com`: spends one of the 10 signups an hour.
export async function fresh_account(request: APIRequestContext, what: string): Promise<string> {
  const email = `e2e-${what}-${Date.now()}@example.com`;
  await sign_up(request, email);
  return email;
}

async function sign_up(request: APIRequestContext, email: string) {
  const subject = "Signup Confirmation";
  const earlier = await mail_count(request, email, subject);
  const signup = await request.post(`${ACCOUNTS}/signup/`, {
    data: {
      email,
      password: password_of(email),
      agreements: { email: true, condition: true, newsletter: false },
      language: "en",
    },
  });
  expect(signup.ok(), await signup.text()).toBe(true);
  // The key reaches the customer only in the mail (django-accounts 6.0.1), so read it the way a customer would.
  const link = link_path(await mail(request, email, subject, earlier), "user-handler");
  expect(link, "confirmation link in the signup mail").toBeTruthy();
  const query = new URL(link!, "http://mail.local").searchParams;
  const activate = await request.post(`${ACCOUNTS}/signup/${query.get("uid")}/`, {
    params: { key: query.get("key")! },
  });
  expect(activate.ok(), await activate.text()).toBe(true);
}

// What a spec resets before it starts. Open carts always go: a sign-in merges them into the device's cart.
export type Reset = { addresses?: boolean; wishlist?: boolean; names?: boolean };

async function reset(request: APIRequestContext, { headers, customer_id }: Session, what: Reset) {
  const key = { "x-api-key": CHECKOUT_KEY };
  for (let closed = 0; ; closed++) {
    const latest = await request.get(`${CHECKOUT}/carts/latest/`, { headers: { ...key, ...headers } });
    if (latest.status() === 404) break;
    expect(latest.ok(), await latest.text()).toBe(true);
    expect(closed, "open carts of the customer").toBeLessThan(20);
    const close = await request.delete(`${CHECKOUT}/carts/${(await latest.json()).cart_id}/`, { headers: key });
    expect(close.ok(), await close.text()).toBe(true);
  }
  if (what.addresses) {
    const book = `${ACCOUNTS}/${customer_id}/addresses/`;
    const entries = await request.get(book, { headers });
    for (const id of Object.keys((await entries.json()).data ?? {})) {
      const gone = await request.delete(book, { headers, params: { id } });
      expect(gone.ok(), await gone.text()).toBe(true);
    }
  }
  if (what.wishlist) {
    // 400 while the customer has no wishlist yet.
    const list = await request.get(WISHLIST, { headers });
    const sku = list.ok() ? ((await list.json()).data.products ?? []).map((p: { sku: string }) => p.sku) : [];
    if (sku.length) {
      const gone = await request.delete(`${WISHLIST}product/`, { headers, data: { sku } });
      expect(gone.ok(), await gone.text()).toBe(true);
    }
  }
  if (what.names) {
    const profile = await request.patch(`${ACCOUNTS}/${customer_id}/profile/`, {
      headers,
      data: { firstname: "E2e", lastname: "Customer" },
    });
    expect(profile.ok(), await profile.text()).toBe(true);
  }
}

// The spec's own customer, `e2e-<name>@example.com`, reset. `left_behind` is a password the spec sets and may leave
// on the account when a run stops half-way (password.spec): the account gets PASSWORD back.
export async function test_account(request: APIRequestContext, name: string, what: Reset = {}, left_behind?: string) {
  return ready(request, `e2e-${name}@example.com`, what, left_behind);
}

// The demo customer, reset.
export async function demo_account(request: APIRequestContext, what: Reset = {}) {
  return ready(request, DEMO_EMAIL, what);
}

async function ready(request: APIRequestContext, email: string, what: Reset, left_behind?: string): Promise<string> {
  const password = password_of(email);
  let answer = await tokens(request, email, password);
  if (answer.status() === 403 && left_behind) {
    const other = await tokens(request, email, left_behind);
    if (other.ok()) {
      await change_password(request, await session_of(other), left_behind, password);
      answer = await tokens(request, email, password);
    }
  }
  // 403 is also the answer for an unknown e-mail (`no_active_account`).
  if (answer.status() === 403) {
    await sign_up(request, email);
    answer = await tokens(request, email, password);
  }
  const signed_in = await session_of(answer);
  sessions.set(email, { at: Date.now(), session: signed_in });
  await reset(request, signed_in, what);
  return email;
}

async function change_password(request: APIRequestContext, { headers }: Session, from: string, to: string) {
  const res = await request.post(`${ACCOUNTS}/password/change/`, {
    headers,
    data: { old_password: from, new_password: to, new_password_check: to },
  });
  expect(res.ok(), await res.text()).toBe(true);
}

// Puts PASSWORD back on a test account a spec gave the password `from`.
export async function restore_password(request: APIRequestContext, email: string, from: string) {
  await change_password(request, await session_of(await tokens(request, email, from)), from, PASSWORD);
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
  await sheet.getByLabel("Password").fill(password_of(email));
  await sheet.getByRole("button", { name: "Sign in", exact: true }).click();
  // Login waits for the cart merge (carts/latest/ is recomputed on every read, ~2 s while the whole
  // suite loads the backend) before it moves to the profile.
  await expect(page).toHaveURL(/\/profile$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "My account" })).toBeVisible();
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
  const { headers, customer_id } = await session(request, email);
  const addresses = `${ACCOUNTS}/${customer_id}/addresses/`;
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
  const { headers, customer_id } = await session(request, email);
  const res = await request.post(`${ACCOUNTS}/${customer_id}/addresses/defaults/`, {
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
  const { headers } = await session(request, email);
  const cart = await request.post(`${CHECKOUT}/carts/`, {
    headers: { "x-api-key": CHECKOUT_KEY, ...headers },
    data: { items, currency_code: "EUR" },
  });
  expect(cart.ok(), await cart.text()).toBe(true);
}
