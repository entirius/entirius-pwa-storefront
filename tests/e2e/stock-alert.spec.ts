// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page, type Route } from "@playwright/test";
import app_config from "../../_CONFIG/app.config.json";
import channels from "../../_CONFIG/channels.config.json";
import { login, test_account } from "./support/account";

// "Tell me when it is back" needs the channel's stock-alerts key (cookie `sa_key`, from API_STOCK_ALERTS_KEY). The
// UI tests set the cookie and answer the stock-alerts API and the stock themselves; the last test posts for real
// and skips unless the channel has a key.
// Seeded: captains-living-room-set has the series Orion (ENT-C001) and Nebula (ENT-S002); promenade-bench
// (ENT-X002, no variants) is sold out.

const CONFIGURABLE = "/product/captains-living-room-set";
const SOLD_OUT_SIZE = "ENT-S002";
const SOLD_OUT = "/product/promenade-bench";
const SUBSCRIBE = /\/stock-alerts\/v2\/[^/]+\/subscriptions\/$/;
const STOCK = /\/stock\/\?/;
const EMAIL = "ann@example.com";

async function with_key(page: Page) {
  const host = new URL(app_config.SITE_URL).hostname;
  await page.context().addCookies([{ name: "sa_key", value: "test-key", domain: host, path: "/" }]);
}

// Every asked SKU is in stock except the `sold_out` ones (left out of the answer, as the backend does).
async function stock(page: Page, sold_out: () => string[]) {
  await page.route(STOCK, (route) => {
    const skus = new URL(route.request().url()).searchParams.getAll("sku");
    const body = Object.fromEntries(
      skus.filter((sku) => !sold_out().includes(sku)).map((sku) => [sku, { quantity: 5, is_in_stock: true }]),
    );
    return route.fulfill({ json: body });
  });
}

// Records the posts and answers each with `status`.
async function subscriptions(page: Page, status: () => number) {
  const posts: Record<string, unknown>[] = [];
  await page.route(SUBSCRIBE, (route: Route) => {
    posts.push(route.request().postDataJSON());
    const code = status();
    return route.fulfill({ status: code, json: code === 201 ? { status: "saved" } : { error: "X" } });
  });
  return posts;
}

const form = (page: Page) => page.locator("form[data-stock-alert]");
const sold_out_option = (page: Page) => page.getByRole("radio", { name: /Nebula Heritage/ });

async function choose_sold_out_size(page: Page) {
  await page.goto(CONFIGURABLE);
  await sold_out_option(page).click();
  await expect(page).toHaveURL(new RegExp(`variant=${SOLD_OUT_SIZE}`));
  await expect(form(page)).toBeVisible();
}

async function fill(page: Page, { consent = true } = {}) {
  await form(page).getByRole("textbox", { name: "Email address" }).fill(EMAIL);
  if (consent) await form(page).locator("[data-stock-alert-consent] button").click();
}

const submit = (page: Page) => form(page).getByRole("button", { name: "Notify me when available" }).click();

for (const [project, viewport] of [
  ["desktop", { width: 1280, height: 800 }],
  ["phone", { width: 360, height: 780 }],
] as const) {
  test.describe(project, () => {
    test.use({ viewport });

    test.beforeEach(async ({ page }) => {
      await with_key(page);
      await stock(page, () => [SOLD_OUT_SIZE]);
    });

    test("a sold-out size is selectable and shows the form", async ({ page }) => {
      await page.goto(CONFIGURABLE);
      await expect(sold_out_option(page)).toBeEnabled();
      await expect(sold_out_option(page)).toHaveClass(/line-through/);
      await sold_out_option(page).click();
      await expect(form(page)).toBeVisible();
      await expect(form(page)).toHaveAttribute("data-stock-alert-state", "idle");
      await expect(form(page)).toContainText("Series Nebula Heritage");
      await expect(page.locator("[data-buy-area]").getByRole("button", { name: "Out of stock" })).toHaveCount(0);
    });

    test("a valid request posts the selected SKU and shows the saved state, also after a reload", async ({ page }) => {
      const posts = await subscriptions(page, () => 201);
      await choose_sold_out_size(page);
      await fill(page);
      await submit(page);
      await expect(page.locator('[data-stock-alert-state="saved"] [role=status]')).toContainText(
        "We will email you when Series Nebula Heritage is back.",
      );
      await expect(page.locator("[data-stock-alert-consent]")).toHaveCount(0);
      expect(posts).toHaveLength(1);
      expect(posts[0]).toMatchObject({
        email: EMAIL,
        sku: SOLD_OUT_SIZE,
        language: "en",
        country: expect.any(String),
        consent: true,
        consent_text: expect.stringContaining("I agree to get one email when this product is back in stock"),
      });
      expect(posts[0].consent_text).not.toContain("{privacy}");

      await page.reload();
      await expect(page.locator('[data-stock-alert-state="saved"]')).toBeVisible();
      // Remembered from before: shown, not announced again.
      await expect(page.locator('[data-stock-alert-state="saved"] [role=status]')).toHaveCount(0);
      await page.getByRole("button", { name: "Use another address" }).click();
      await expect(form(page)).toBeVisible();
    });

    test("the phone bar offers the request and scrolls to the form", async ({ page }) => {
      test.skip(project !== "phone", "the sticky bar is a phone control");
      await choose_sold_out_size(page);
      await page.mouse.wheel(0, 4000);
      const trigger = page.locator("[data-buy-bar] [data-stock-alert-trigger]");
      await expect(trigger).toBeVisible();
      await trigger.click();
      await expect(form(page)).toBeInViewport();
    });
  });
}

test.describe("answers", () => {
  test.beforeEach(async ({ page }) => {
    await with_key(page);
  });

  test("without the consent the request is invalid and nothing is posted", async ({ page }) => {
    await stock(page, () => [SOLD_OUT_SIZE]);
    const posts = await subscriptions(page, () => 201);
    await choose_sold_out_size(page);
    await fill(page, { consent: false });
    await submit(page);
    await expect(form(page)).toHaveAttribute("data-stock-alert-state", "invalid");
    await expect(form(page).locator("[role=alert]")).toContainText("accept the consent");
    expect(posts).toHaveLength(0);
  });

  test("409 re-reads the stock and brings the buy button back", async ({ page }) => {
    let restocked = false;
    await stock(page, () => (restocked ? [] : [SOLD_OUT_SIZE]));
    await subscriptions(page, () => {
      restocked = true;
      return 409;
    });
    await choose_sold_out_size(page);
    await fill(page);
    await submit(page);
    await expect(page.locator("[data-buy-area]").getByRole("button", { name: "Add to cart" })).toBeEnabled();
    await expect(form(page)).toHaveCount(0);
  });

  test("429 shows the throttled message and keeps the form filled", async ({ page }) => {
    await stock(page, () => [SOLD_OUT_SIZE]);
    await subscriptions(page, () => 429);
    await choose_sold_out_size(page);
    await fill(page);
    await submit(page);
    await expect(form(page).locator("[role=alert]")).toHaveText("Too many requests. Try again later.");
    await expect(form(page).getByRole("textbox", { name: "Email address" })).toHaveValue(EMAIL);
  });

  test("a filled honeypot posts nothing and shows the saved state", async ({ page }) => {
    await stock(page, () => [SOLD_OUT_SIZE]);
    const posts = await subscriptions(page, () => 201);
    await choose_sold_out_size(page);
    await fill(page);
    await form(page)
      .locator('input[name="website"]')
      .evaluate((el: HTMLInputElement) => (el.value = "http://spam"));
    await submit(page);
    await expect(page.locator('[data-stock-alert-state="saved"]')).toBeVisible();
    expect(posts).toHaveLength(0);
  });

  test("with every size sold out and none chosen, the area asks for a choice", async ({ page }) => {
    await stock(page, () => ["ENT-C001", "ENT-S001", SOLD_OUT_SIZE]);
    await page.goto(CONFIGURABLE);
    await expect(page.locator('[data-stock-alert-state="choose"]')).toBeVisible();
    await sold_out_option(page).click();
    await expect(form(page)).toBeVisible();
  });

  test("a product without variants and sold out shows the form", async ({ page }) => {
    const posts = await subscriptions(page, () => 201);
    await page.goto(SOLD_OUT);
    await expect(form(page)).toBeVisible();
    await fill(page);
    await submit(page);
    await expect(page.locator('[data-stock-alert-state="saved"]')).toBeVisible();
    expect(posts[0]).toMatchObject({ sku: "ENT-X002" });
  });

  test("keyboard only: from the picker to the saved state", async ({ page }) => {
    await stock(page, () => [SOLD_OUT_SIZE]);
    await subscriptions(page, () => 201);
    await page.goto(`${CONFIGURABLE}?variant=ENT-C001`);
    // Hydrated and the stock has answered: the radios react to keys now.
    await expect(page.locator("[data-product-page]")).toHaveAttribute("data-stock", "in");
    await page.getByRole("radio", { name: /Orion Collection/ }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(sold_out_option(page)).toBeFocused();
    // Space checks the focused radio (a no-op when the arrow already did).
    await page.keyboard.press("Space");
    await expect(sold_out_option(page)).toBeChecked();
    await expect(form(page)).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(form(page).getByRole("textbox", { name: "Email address" })).toBeFocused();
    await page.keyboard.type(EMAIL);
    await page.keyboard.press("Tab");
    await expect(form(page).getByRole("checkbox")).toBeFocused();
    await page.keyboard.press("Space");
    const button = form(page).getByRole("button", { name: "Notify me when available" });
    await expect(async () => {
      await page.keyboard.press("Tab");
      await expect(button).toBeFocused({ timeout: 500 });
    }).toPass({ timeout: 5_000 });
    await page.keyboard.press("Enter");
    // The form is gone: focus moves to the announcement, not to the top of the page.
    await expect(page.locator('[data-stock-alert-state="saved"] [role=status]')).toBeFocused();
  });

  test("a signed-in customer has the address prefilled", async ({ page, request }) => {
    const email = await test_account(request, "stock-alert");
    await login(page, email);
    await page.goto(SOLD_OUT);
    await expect(form(page).getByRole("textbox", { name: "Email address" })).toHaveValue(email);
  });
});

test("without the key a sold-out size stays disabled and no form shows", async ({ page }) => {
  await stock(page, () => [SOLD_OUT_SIZE, "ENT-X002"]);
  await page.goto(CONFIGURABLE);
  await expect(page.getByRole("radio", { name: /Orion Collection/ })).toBeEnabled();
  await expect(sold_out_option(page)).toBeDisabled();
  await page.goto(SOLD_OUT);
  await expect(page.locator("[data-buy-area]").getByRole("button", { name: "Out of stock" })).toBeDisabled();
  await expect(page.locator("[data-stock-alert]")).toHaveCount(0);
});

// Live: the backend saves the request (plan 05 reads it back in the admin and the signup mail).
test("the real backend saves a request", async ({ page }) => {
  const key = (channels as Record<string, { API_STOCK_ALERTS_KEY?: string }>)["default-europe"]?.API_STOCK_ALERTS_KEY;
  test.skip(!key, "channel default-europe has no API_STOCK_ALERTS_KEY");
  await page.goto(SOLD_OUT);
  await fill(page);
  const [response] = await Promise.all([page.waitForResponse(SUBSCRIBE), submit(page)]);
  expect(response.status()).toBe(201);
  await expect(page.locator('[data-stock-alert-state="saved"]')).toBeVisible();
});
