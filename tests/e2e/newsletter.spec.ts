// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";
import app_config from "../../_CONFIG/app.config.json";
import channels from "../../_CONFIG/channels.config.json";
import { link_path, mail } from "./support/mail";

// The newsletter needs the channel's newsletter key (cookie `nl_key`, from API_NEWSLETTER_KEY). The UI tests answer
// the subscription themselves; the end-to-end tests go through the backend and the confirmation mail, and are skipped
// when the channel has no key.

const SUBSCRIBE = /\/agreements\/v2\/[^/]+\/newsletter\/subscribe\//;
const MAIL_SUBJECT = "Newsletter Signup Confirmation";
const has_key = !!(channels as Record<string, { API_NEWSLETTER_KEY?: string }>)["default-europe"]?.API_NEWSLETTER_KEY;

async function with_key(page: Page) {
  const host = new URL(app_config.SITE_URL).hostname;
  await page.context().addCookies([{ name: "nl_key", value: "test-key", domain: host, path: "/" }]);
}

function footer_form(page: Page) {
  return page.locator("footer [data-newsletter-form]");
}

test("the footer form asks for a valid address and the consent, then sends both with the key", async ({ page }) => {
  await with_key(page);
  let sent: { key: string | null; body: unknown } | null = null;
  await page.route(SUBSCRIBE, (route) => {
    sent = { key: route.request().headers()["x-api-key"] ?? null, body: route.request().postDataJSON() };
    return route.fulfill({ status: 201, json: { detail: "If eligible, a confirmation will be sent." } });
  });
  await page.goto("/");
  // proxy.ts replaces the test key with the channel's own when it has one.
  const key = (await page.context().cookies()).find((c) => c.name === "nl_key")?.value;
  const form = footer_form(page);

  await form.getByLabel("Email address").fill("not-an-address");
  await form.getByRole("button", { name: "Subscribe" }).click();
  await expect(form.getByText("Enter a valid email address and accept the consent.")).toBeVisible();
  expect(sent).toBeNull();

  await form.getByLabel("Email address").fill("ann@example.com");
  await form.locator("[data-newsletter-consent]").getByRole("checkbox").check();
  await form.getByRole("button", { name: "Subscribe" }).click();
  await expect(page.locator("footer [data-newsletter-sent]")).toContainText("Almost done");
  expect(sent).toEqual({ key, body: { email: "ann@example.com", language: "en" } });
});

test("the consent links to the privacy page the agreement definition names", async ({ page }) => {
  await with_key(page);
  // The seeded privacy-policy definition names the CMS route "privacy"; CHECKOUT.PRIVACY_ROUTE only stands in
  // without it.
  await page.goto("/");
  const consent = footer_form(page).locator("[data-newsletter-consent]");
  await expect(consent.getByRole("link", { name: "privacy policy" })).toHaveAttribute("href", "/privacy");
});

test("a link without a token or with a broken one says it does not work", async ({ page }) => {
  await page.goto("/newsletter/confirm");
  await expect(page.getByRole("heading", { name: "This link does not work" })).toBeVisible();
  await page.goto("/newsletter/unsubscribe?token=not-a-token");
  await expect(page.getByRole("heading", { name: "This link does not work" })).toBeVisible();
});

test("a visitor subscribes in the footer, confirms from the mail and unsubscribes", async ({ page, request }) => {
  test.skip(!has_key, "channel default-europe has no API_NEWSLETTER_KEY");
  const email = `e2e-newsletter-${Date.now()}@example.com`;

  await page.goto("/");
  const form = footer_form(page);
  await form.getByLabel("Email address").fill(email);
  await form.locator("[data-newsletter-consent]").getByRole("checkbox").check();
  await form.getByRole("button", { name: "Subscribe" }).click();
  await expect(page.locator("footer [data-newsletter-sent]")).toContainText("Almost done");

  // The mail links to the backend's STOREFRONT_BASE_URL: only the path and the token are taken.
  const mime = await mail(request, email, MAIL_SUBJECT);
  const confirm = link_path(mime, "newsletter/confirm");
  const unsubscribe = link_path(mime, "newsletter/unsubscribe");
  expect(confirm, "confirmation link in the mail").not.toBeNull();
  expect(unsubscribe, "unsubscribe link in the mail").not.toBeNull();

  await page.goto(confirm!);
  await expect(page.getByRole("heading", { name: "You are subscribed" })).toBeVisible();
  await page.goto(unsubscribe!);
  await expect(page.getByRole("heading", { name: "You are unsubscribed" })).toBeVisible();
});

test("a new customer can sign up for the newsletter when registering", async ({ page, request }) => {
  test.skip(!has_key, "channel default-europe has no API_NEWSLETTER_KEY");
  const email = `e2e-newsletter-signup-${Date.now()}@example.com`;
  const password = "E2e-Signup-2026!";

  await page.goto("/");
  await page.locator("header").getByRole("button", { name: "Sign in" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("button", { name: "Register" }).click();
  await sheet.getByLabel("Email").fill(email);
  await sheet.getByLabel("Password", { exact: true }).fill(password);
  await sheet.getByLabel("Confirm password").fill(password);
  await sheet.getByLabel("I accept the terms of service and privacy policy.").check();
  await sheet.getByLabel("I consent to the processing of my personal data.").check();
  await sheet.getByLabel("Send me the newsletter (we will ask you to confirm the address first).").check();
  await sheet.getByRole("button", { name: "Create account" }).click();
  await expect(sheet.getByText("Account created — check your email to confirm, then sign in.")).toBeVisible();

  expect(link_path(await mail(request, email, MAIL_SUBJECT), "newsletter/confirm")).not.toBeNull();
});
