// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";
import { login, test_account } from "./support/account";
import { fill_address } from "./support/checkout";

// Delivery to a pickup point: the seed's `inpost-locker` (InPost lockers) and `pickup-point` (every point type) of
// default-europe, with the points of django_deliverypoints. The local config has no map key, so the picker is the
// list: a search, "Near me" and the points.

const PRODUCT = "/product/flight-deck-command-chair";

async function to_shipping(page: Page) {
  await page.goto(PRODUCT);
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.locator("header").getByRole("link", { name: /^Cart, 1 item$/ }).click();
  await page.getByRole("complementary", { name: "Order summary" }).getByRole("link", { name: "Go to checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
}

async function continue_to_shipping(page: Page) {
  const next = page.getByRole("button", { name: "Continue to shipping" });
  await expect(next).toBeEnabled();
  await next.click();
}

const points = (page: Page) => page.getByRole("radiogroup", { name: "Pickup point" });

test("a parcel locker chosen from the list goes with the order", async ({ page, request }) => {
  const email = await test_account(request, "points", { addresses: true });
  await login(page, email);
  await to_shipping(page);
  const form = page.locator("main form");
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("First name").fill("Pola");
  await form.getByLabel("Last name").fill("Punkt");
  await form.getByLabel("Street and number").fill("Odbiorcza 2");
  await form.getByLabel("Postal code").fill("00-001");
  await form.getByLabel("City").fill("Warsaw");
  await form.getByRole("combobox", { name: "Country" }).click();
  await page.getByRole("option", { name: "Poland" }).click();
  await form.getByLabel("Phone number").fill("600100200");
  await continue_to_shipping(page);

  await page.getByRole("radio", { name: /InPost Parcel Locker/ }).click();
  const to_payment = page.getByRole("button", { name: "Continue to payment" });
  await expect(page.getByText("Choose a pickup point to continue.")).toBeVisible();
  await expect(to_payment).toBeDisabled();

  // The list starts with the address's city; the seed spells it the Polish way.
  await expect(page.getByText("No pickup points here. Try another city or postal code.")).toBeVisible();
  await page.getByLabel("City, postal code or point name").fill("Warszawa");
  await page.locator("main").getByRole("button", { name: "Search", exact: true }).click();
  const locker = points(page).getByRole("radio", { name: /Paczkomat WAW01A/ });
  await expect(locker).toBeVisible();
  // InPost lockers only: the DPD point of Warsaw stays out.
  await expect(points(page)).not.toContainText("DPD");

  await locker.click();
  await expect(to_payment).toBeEnabled();
  await to_payment.click();
  await page.getByRole("radiogroup").getByText(/bank transfer/i).click();
  await page.getByRole("button", { name: "Continue to review" }).click();
  const shipping = page.locator("section", { hasText: "Shipping method" });
  await expect(shipping).toContainText("Paczkomat WAW01A");
  await expect(shipping).toContainText("00-624 Warszawa");

  const placed = page.waitForResponse((r) => r.request().method() === "POST" && /\/orders\/?(\?|$)/.test(r.url()));
  for (const required of await page.locator("[data-agreement-required]").all()) {
    await required.getByRole("checkbox").click();
  }
  await page.getByRole("button", { name: "Order with obligation to pay" }).click();
  const response = await placed;
  expect(response.status()).toBe(201);
  const ref: string = (await response.json()).order_pretty_id;
  await expect(page).toHaveURL(`/checkout/success?ref=${ref}`);
  await expect(page.getByText(/Paczkomat WAW01A/)).toBeVisible();

  // The order keeps the point: the account reads it back from the backend.
  await page.goto(`/profile/orders/${ref}`);
  await expect(page.getByText(/Paczkomat WAW01A, ul\. Marszalkowska 10, 00-624 Warszawa/)).toBeVisible();
});

test.describe("near me", () => {
  test.use({ geolocation: { latitude: 52.2297, longitude: 21.0122 }, permissions: ["geolocation"] });

  test("finds the points around the visitor, of every type for a pickup point", async ({ page }) => {
    await to_shipping(page);
    await fill_address(page);
    await continue_to_shipping(page);

    await page.getByRole("radio", { name: /Pickup Point/ }).click();
    await page.getByRole("button", { name: "Near me" }).click();

    const nearest = points(page).getByRole("radio").first();
    await expect(nearest).toHaveAccessibleName(/Paczkomat WAW01A/);
    const row = points(page).locator("label").first();
    await expect(row).toContainText("0 km");
    await expect(row).toContainText("InPost");
    await expect(points(page)).toContainText("DPD Pickup");

    await nearest.click();
    await expect(page.getByRole("button", { name: "Continue to payment" })).toBeEnabled();
  });
});
