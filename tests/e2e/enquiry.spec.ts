// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";
import channels from "../../_CONFIG/channels.config.json";
import app_config from "../../_CONFIG/app.config.json";

// The enquiry form needs the channel's contact-forms key (cookie `cf_key`, from API_CONTACT_FORMS_KEY) and the
// form type `product-enquiry` in the backend. The UI tests answer the contact-forms API themselves, so they
// run on any backend; the last test posts for real and skips unless the channel is set up for it.

const PRICED = "/product/docking-bay-chair";
const UNPRICED = "/product/chief-engineers-custom-throne";
const FORM_TYPES = /\/contact-forms\/v2\/[^/]+\/form-types\//;
const SUBMIT = /\/contact-forms\/v2\/[^/]+\/submit\/product-enquiry\//;

async function with_forms(page: Page, types: string[]) {
  const host = new URL(app_config.SITE_URL).hostname;
  await page.context().addCookies([{ name: "cf_key", value: "test-key", domain: host, path: "/" }]);
  await page.route(FORM_TYPES, (route) =>
    route.fulfill({ json: { results: types.map((code) => ({ code, label: code, is_default: false })) } }),
  );
}

async function fill_form(page: Page) {
  await page.getByLabel("Your name").fill("Ann Tester");
  await page.getByLabel("Email address").fill("ann@example.com");
  await page.getByLabel("Message").fill("Is it possible to see it in person?");
}

test("a priced product offers a collapsed question that opens the form", async ({ page }) => {
  await with_forms(page, ["product-enquiry"]);
  await page.goto(PRICED);
  const trigger = page.locator("[data-enquiry-trigger]");
  await expect(trigger).toHaveText("Ask about this product");
  await expect(page.locator("[data-enquiry-form]")).toHaveCount(0);
  await trigger.click();
  await expect(page.locator("[data-enquiry-form]")).toBeVisible();
});

test("a product without a price leads with the enquiry", async ({ page }) => {
  await with_forms(page, ["product-enquiry"]);
  await page.goto(UNPRICED);
  await expect(page.locator("[data-enquiry-trigger]")).toHaveText("Ask for the price");
});

test("no form without the form type or without the key", async ({ page }) => {
  await with_forms(page, ["general"]);
  await page.goto(PRICED);
  await expect(page.getByRole("button", { name: "Add to cart" })).toBeVisible();
  await expect(page.locator("[data-enquiry-trigger]")).toHaveCount(0);

  await page.context().clearCookies({ name: "cf_key" });
  await page.route(FORM_TYPES, (route) => route.fulfill({ status: 401, json: { detail: "no key" } }));
  await page.goto(PRICED);
  await expect(page.getByRole("button", { name: "Add to cart" })).toBeVisible();
  await expect(page.locator("[data-enquiry-trigger]")).toHaveCount(0);
});

test("consent and fields are required, the honeypot sends nothing", async ({ page }) => {
  await with_forms(page, ["product-enquiry"]);
  let posts = 0;
  await page.route(SUBMIT, (route) => {
    posts += 1;
    return route.fulfill({ status: 201, json: {} });
  });
  await page.goto(PRICED);
  await page.locator("[data-enquiry-trigger]").click();
  await fill_form(page);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator("[data-enquiry-form] [role=alert]")).toContainText("accept the data processing");
  expect(posts).toBe(0);

  await page.locator("[data-enquiry-consent] button").click();
  await page.locator('input[name="website"]').evaluate((el: HTMLInputElement) => (el.value = "http://spam"));
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator("[data-enquiry-sent]")).toBeVisible();
  expect(posts).toBe(0);
});

test("the submission carries the product, the consent and the page", async ({ page }) => {
  await with_forms(page, ["product-enquiry"]);
  await page.route(SUBMIT, (route) => route.fulfill({ status: 201, json: {} }));
  await page.goto(PRICED);
  await page.locator("[data-enquiry-trigger]").click();
  await fill_form(page);
  await page.locator("[data-enquiry-consent] button").click();
  const [request] = await Promise.all([
    page.waitForRequest(SUBMIT),
    page.getByRole("button", { name: "Send" }).click(),
  ]);
  const payload = request.postDataJSON();
  expect(request.headers()["x-api-key"]).toBeTruthy(); // test-key, or the real one the proxy sets
  expect(payload).toMatchObject({
    email: "ann@example.com",
    slug: "product-enquiry",
    code: "ENT-C002",
    body: { name: "Ann Tester", consent_privacy_info: true },
  });
  expect(payload.body.page_url).toContain(PRICED);
  await expect(page.locator("[data-enquiry-sent]")).toBeVisible();
});

test("a rejected submission shows an error and keeps the form", async ({ page }) => {
  await with_forms(page, ["product-enquiry"]);
  await page.route(SUBMIT, (route) => route.fulfill({ status: 500, json: {} }));
  await page.goto(PRICED);
  await page.locator("[data-enquiry-trigger]").click();
  await fill_form(page);
  await page.locator("[data-enquiry-consent] button").click();
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator("[data-enquiry-form] [role=alert]")).toContainText("could not be sent");
  await expect(page.locator("[data-enquiry-form]")).toBeVisible();
});

test("the real backend accepts an enquiry", async ({ page, request }) => {
  const key = (channels as Record<string, { API_CONTACT_FORMS_KEY?: string }>)["default-europe"]?.API_CONTACT_FORMS_KEY;
  test.skip(!key, "channel default-europe has no API_CONTACT_FORMS_KEY");
  const types = await request.get(`${app_config.API_BASE_URL}/api/contact-forms/v2/default-europe/form-types/`, {
    headers: { "X-API-KEY": key! },
  });
  const codes = types.ok() ? ((await types.json()).results as { code: string }[]).map((t) => t.code) : [];
  test.skip(!codes.includes("product-enquiry"), "form type product-enquiry is not defined in the backend");

  await page.goto(PRICED);
  await page.locator("[data-enquiry-trigger]").click();
  await fill_form(page);
  await page.locator("[data-enquiry-consent] button").click();
  const [response] = await Promise.all([
    page.waitForResponse(SUBMIT),
    page.getByRole("button", { name: "Send" }).click(),
  ]);
  expect(response.status()).toBe(201);
  await expect(page.locator("[data-enquiry-sent]")).toBeVisible();
});
