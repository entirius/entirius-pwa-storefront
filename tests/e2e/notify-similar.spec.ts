// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";
import channels from "../../_CONFIG/channels.config.json";
import app_config from "../../_CONFIG/app.config.json";

// "Tell me when a similar product arrives" needs the channel's contact-forms key (cookie `cf_key`, from
// API_CONTACT_FORMS_KEY) and the form type `notify-similar` in the backend. The UI tests answer the
// contact-forms API themselves; the last test posts for real and skips unless the channel is set up for it.
// Seeded: promenade-bench is sold out (stock 0), the category nightstands has no products.

const SOLD_OUT = "/product/promenade-bench";
const IN_STOCK = "/product/docking-bay-chair";
const EMPTY_CATEGORY = "/catalog/nightstands";
const FORM_TYPES = /\/contact-forms\/v2\/[^/]+\/form-types\//;
const SUBMIT = /\/contact-forms\/v2\/[^/]+\/submit\/notify-similar\//;

async function with_forms(page: Page, types: string[]) {
  const host = new URL(app_config.SITE_URL).hostname;
  await page.context().addCookies([{ name: "cf_key", value: "test-key", domain: host, path: "/" }]);
  await page.route(FORM_TYPES, (route) =>
    route.fulfill({ json: { results: types.map((code) => ({ code, label: code, is_default: false })) } }),
  );
}

async function request_form(page: Page) {
  await page.locator("[data-notify-trigger]").click();
  await page.getByLabel("Email address").fill("ann@example.com");
  await page.getByLabel(/What are you looking for/).fill("Something similar, not too big");
  await page.locator("[data-notify-consent] button").click();
}

test("a sold-out product offers the request, an in-stock one does not", async ({ page }) => {
  await with_forms(page, ["notify-similar"]);
  await page.goto(SOLD_OUT);
  await expect(page.locator("[data-notify-trigger]")).toHaveText("Tell me when a similar product arrives");

  await page.goto(IN_STOCK);
  await expect(page.getByRole("button", { name: "Add to cart" })).toBeEnabled();
  await expect(page.locator("[data-notify-trigger]")).toHaveCount(0);
});

test("an empty category offers the request, a category with products does not", async ({ page }) => {
  await with_forms(page, ["notify-similar"]);
  await page.goto(EMPTY_CATEGORY);
  await expect(page.locator("[data-catalog-empty] [data-notify-trigger]")).toBeVisible();

  await page.goto("/catalog/chairs");
  await expect(page.locator('a[href^="/product/"]').first()).toBeVisible();
  await expect(page.locator("[data-notify-trigger]")).toHaveCount(0);
});

test("no request without the form type", async ({ page }) => {
  await with_forms(page, ["product-enquiry"]);
  await page.goto(SOLD_OUT);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-notify-trigger]")).toHaveCount(0);
});

test("email and consent are required, the honeypot sends nothing", async ({ page }) => {
  await with_forms(page, ["notify-similar"]);
  let posts = 0;
  await page.route(SUBMIT, (route) => {
    posts += 1;
    return route.fulfill({ status: 201, json: {} });
  });
  await page.goto(SOLD_OUT);
  await page.locator("[data-notify-trigger]").click();
  await page.getByLabel("Email address").fill("ann@example.com");
  await page.getByRole("button", { name: "Notify me" }).click();
  await expect(page.locator("[data-notify-form] [role=alert]")).toContainText("accept the data processing");
  expect(posts).toBe(0);

  await page.locator("[data-notify-consent] button").click();
  await page.locator('input[name="website"]').evaluate((el: HTMLInputElement) => (el.value = "http://spam"));
  await page.getByRole("button", { name: "Notify me" }).click();
  await expect(page.locator("[data-notify-sent]")).toBeVisible();
  expect(posts).toBe(0);
});

test("the request carries the product, the note, the consent and the page", async ({ page }) => {
  await with_forms(page, ["notify-similar"]);
  await page.route(SUBMIT, (route) => route.fulfill({ status: 201, json: {} }));
  await page.goto(SOLD_OUT);
  await request_form(page);
  const [request] = await Promise.all([
    page.waitForRequest(SUBMIT),
    page.getByRole("button", { name: "Notify me" }).click(),
  ]);
  const payload = request.postDataJSON();
  expect(payload).toMatchObject({
    email: "ann@example.com",
    slug: "notify-similar",
    code: "ENT-X002",
    body: {
      product_sku: "ENT-X002",
      product_name: expect.any(String),
      category: expect.any(String),
      note: "Something similar, not too big",
      consent_privacy_info: true,
    },
  });
  // No attribute is configured by default: nothing but the product, category, note and the technical fields.
  expect(Object.keys(payload.body).sort()).toEqual(
    ["category", "consent_privacy_info", "language", "note", "page_url", "product_name", "product_sku"],
  );
  await expect(page.locator("[data-notify-sent]")).toBeVisible();
});

test("the empty category request names the category", async ({ page }) => {
  await with_forms(page, ["notify-similar"]);
  await page.route(SUBMIT, (route) => route.fulfill({ status: 201, json: {} }));
  await page.goto(EMPTY_CATEGORY);
  await request_form(page);
  const [request] = await Promise.all([
    page.waitForRequest(SUBMIT),
    page.getByRole("button", { name: "Notify me" }).click(),
  ]);
  expect(request.postDataJSON().body).toMatchObject({ category: "Nightstands" });
  expect(request.postDataJSON().code).toBeUndefined();
});

test("the real backend accepts a request", async ({ page, request }) => {
  const key = (channels as Record<string, { API_CONTACT_FORMS_KEY?: string }>)["default-europe"]?.API_CONTACT_FORMS_KEY;
  test.skip(!key, "channel default-europe has no API_CONTACT_FORMS_KEY");
  const types = await request.get(`${app_config.API_BASE_URL}/api/contact-forms/v2/default-europe/form-types/`, {
    headers: { "X-API-KEY": key! },
  });
  const codes = types.ok() ? ((await types.json()).results as { code: string }[]).map((t) => t.code) : [];
  test.skip(!codes.includes("notify-similar"), "form type notify-similar is not defined in the backend");

  await page.goto(SOLD_OUT);
  await request_form(page);
  const [response] = await Promise.all([
    page.waitForResponse(SUBMIT),
    page.getByRole("button", { name: "Notify me" }).click(),
  ]);
  expect(response.status()).toBe(201);
  await expect(page.locator("[data-notify-sent]")).toBeVisible();
});
