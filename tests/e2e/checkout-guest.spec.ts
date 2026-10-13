// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";

// Guest checkout end to end: PDP → cart page → address → shipping → payment →
// review → a real order on the backend → success page. Every run places an order
// in the seeded `default-europe` channel.
//
// The address is typed in, not filled by the DEBUG "Fill test data" button, so the
// spec holds with DEBUG_MODE off. Poland, not Germany: in July the backend served
// shipping methods for DE only. Amounts are not asserted — the automatic discount
// may come and go.
//
// Never place orders from parallel workers: the backend numbers orders per channel
// without a lock, and two orders in the same instant collide on a unique key (500).

const PRODUCT = { url: "/product/flight-deck-command-chair", name: "Flight Deck Command Chair" };

async function fill_address(page: Page) {
  const form = page.locator("form");
  await form.getByLabel("Email").fill("guest-e2e@example.com");
  await form.getByLabel("First name").fill("Anna");
  await form.getByLabel("Last name").fill("Tester");
  await form.getByLabel("Street and number").fill("Testowa 1");
  await form.getByLabel("Postal code").fill("00-001");
  await form.getByLabel("City").fill("Warsaw");
  await form.getByRole("combobox", { name: "Country" }).click();
  await page.getByRole("option", { name: "Poland" }).click();
  // Choosing the country pre-fills its dialling code.
  await expect(form.getByRole("combobox", { name: "Code" })).toHaveText("+48");
  await form.getByLabel("Phone number").fill("600100200");
}

test("guest places an order with bank transfer", async ({ page, context }) => {
  await page.goto(PRODUCT.url);
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.locator("header").getByRole("link", { name: /^Cart, 1 item$/ }).click();
  await expect(page.getByRole("region", { name: "Items in your cart" })).toContainText(PRODUCT.name);
  await page.getByRole("complementary", { name: "Order summary" }).getByRole("link", { name: "Go to checkout" }).click();

  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  const summary = page.locator("section", { hasText: "Order summary" });
  await expect(summary).toContainText(PRODUCT.name);

  // Address. The submit button waits for the backend cart (cid) to exist.
  await fill_address(page);
  const to_shipping = page.getByRole("button", { name: "Continue to shipping" });
  await expect(to_shipping).toBeEnabled();
  await to_shipping.click();

  // Shipping.
  const shipping = page.getByRole("radiogroup");
  await expect(shipping.getByRole("radio").first()).toBeVisible();
  await shipping.getByRole("radio").first().click();
  await page.getByRole("button", { name: "Continue to payment" }).click();

  // Payment: bank transfer, so no gateway redirect.
  await page.getByRole("radiogroup").getByText(/bank transfer/i).click();
  await page.getByRole("button", { name: "Continue to review" }).click();

  // Review shows what the cart holds.
  await expect(page.getByText("Billing address")).toBeVisible();
  await expect(page.getByText("Anna Tester")).toBeVisible();
  await expect(page.locator("section", { hasText: "Shipping method" })).not.toContainText("Not selected");
  await expect(page.locator("section", { hasText: "Payment method" })).toContainText(/bank transfer/i);

  // The summary adds up: delivery has its own row, the total is the one of the cart.
  const summary_review = page.locator("section", { hasText: "Order summary" });
  await expect(summary_review).toContainText("Delivery");
  await expect(summary_review).toContainText(/Total\s*€/);

  // The order needs the terms consent, and the button names the obligation to pay. With no terms or
  // privacy route configured the consent line has no links.
  const place = page.getByRole("button", { name: "Order with obligation to pay" });
  await expect(place).toBeDisabled();
  const consent = page.locator("[data-terms-consent]");
  await expect(consent).toContainText("terms and conditions");
  await expect(consent.getByRole("link")).toHaveCount(0);
  await consent.getByRole("checkbox").click();
  await expect(place).toBeEnabled();

  const order = page.waitForResponse(
    (r) => r.request().method() === "POST" && /\/orders\/?(\?|$)/.test(r.url()),
  );
  await place.click();
  const response = await order;
  expect(response.status()).toBe(201);
  const placed = await response.json();
  // Bank transfer: no gateway, no payment error.
  expect(placed).toMatchObject({ redirect_url: null, split_orders_pretty_ids: [] });
  expect(placed.payment_error).toBeUndefined();

  const ref = placed.order_pretty_id;
  await expect(page).toHaveURL(`/checkout/success?ref=${ref}`);
  await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible();
  await expect(page.getByText(`(ref ${ref})`)).toBeVisible();

  // Guests cannot read the order back: the receipt kept by the review step shows the number, the
  // amount, the payment method and the delivery.
  const receipt = page.locator("[data-order-receipt]");
  await expect(receipt).toContainText(ref);
  await expect(receipt).toContainText(/Amount to pay\s*€/);
  await expect(receipt).toContainText("Bank Transfer");
  await expect(receipt).toContainText("Europe Standard");
  await expect(page.getByRole("button", { name: "Print / save the confirmation" })).toBeVisible();
  // A transfer shows a button that copies the payment details.
  await expect(receipt.getByRole("button", { name: "Copy payment details" })).toBeVisible();

  // The cart is torn down: no backend cart id, empty header badge.
  await expect
    .poll(async () => (await context.cookies()).some((c) => c.name === "cid" && c.value))
    .toBe(false);
  await expect(page.locator("header").getByRole("link", { name: /^Cart/ })).toHaveAccessibleName("Cart");
});
