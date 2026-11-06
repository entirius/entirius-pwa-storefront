// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";
import channels from "../../_CONFIG/channels.config.json";
import { fill_address } from "./support/checkout";

// Guest checkout end to end: PDP → cart page → address → shipping → payment →
// review → a real order on the backend → success page. Every run places an order
// in the seeded `default-europe` channel. Amounts are not asserted.

const PRODUCT = { url: "/product/flight-deck-command-chair", name: "Flight Deck Command Chair" };
// The email marketing agreement is offered only with the channel's newsletter key (its double opt-in records it).
const HAS_NEWSLETTER_KEY = !!(channels as Record<string, { API_NEWSLETTER_KEY?: string }>)["default-europe"]
  ?.API_NEWSLETTER_KEY;

test("guest places an order with bank transfer", async ({ page, context }) => {
  await page.goto(PRODUCT.url);
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.locator("header").getByRole("link", { name: /^Cart, 1 item$/ }).click();
  await expect(page.getByRole("region", { name: "Items in your cart" })).toContainText(PRODUCT.name);
  await page.getByRole("complementary", { name: "Order summary" }).getByRole("link", { name: "Go to checkout" }).click();

  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  const summary = page.getByRole("complementary", { name: "Order summary" });
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
  const summary_review = page.getByRole("complementary", { name: "Order summary" });
  await expect(summary_review).toContainText("Delivery");
  await expect(summary_review).toContainText(/Total\s*€/);

  // The order needs the channel's mandatory agreements, worded by the backend (django_agreements), and the button
  // names the obligation to pay. Their links open the documents in a new tab.
  const place = page.getByRole("button", { name: "Order with obligation to pay" });
  await expect(place).toBeDisabled();
  await expect(page.locator("[data-agreement-required]")).toHaveCount(2);
  const terms = page.locator('[data-agreement="terms-of-service"]');
  await expect(terms.getByRole("link", { name: "Terms and Conditions" })).toHaveAttribute("target", "_blank");
  await terms.getByRole("checkbox").click();
  await expect(place).toBeDisabled();
  await page.locator('[data-agreement="privacy-policy"]').getByRole("checkbox").click();
  await expect(place).toBeEnabled();
  // Email marketing is optional and goes through the newsletter (double opt-in) once the order exists.
  const marketing = page.locator('[data-agreement="marketing-email"]');
  await expect(marketing).toHaveCount(HAS_NEWSLETTER_KEY ? 1 : 0);
  if (HAS_NEWSLETTER_KEY) await marketing.getByRole("checkbox").click();
  // The subscription itself (and its mail) is newsletter.spec.ts's; here only that the storefront sends it. Answered
  // here, since django-agreements lets one address subscribe three times an hour and this address is fixed.
  await page.route(/\/newsletter\/subscribe\//, (route) =>
    route.fulfill({ status: 201, json: { detail: "If eligible, a confirmation will be sent." } }),
  );
  const subscribed = page.waitForResponse(
    (r) => r.request().method() === "POST" && r.url().includes("/newsletter/subscribe/"),
  );

  const order = page.waitForResponse(
    (r) => r.request().method() === "POST" && /\/orders\/?(\?|$)/.test(r.url()),
  );
  // The agreements are recorded once the order exists, with its id and email.
  const agreements = page.waitForResponse(
    (r) => r.request().method() === "POST" && /\/orders\/[^/]+\/agreements\/?(\?|$)/.test(r.url()),
  );
  await place.click();
  const response = await order;
  expect(response.status()).toBe(201);
  const placed = await response.json();
  const recorded = await agreements;
  expect(recorded.status()).toBe(201);
  expect(recorded.url()).toContain(`/orders/${placed.order_id}/agreements/`);
  expect(recorded.request().postDataJSON()).toEqual({
    email: "guest-e2e@example.com",
    slugs: ["terms-of-service", "privacy-policy"],
    language: "en",
  });
  if (HAS_NEWSLETTER_KEY) {
    const subscription = await subscribed;
    expect(subscription.status()).toBe(201);
    expect(subscription.request().postDataJSON()).toEqual({ email: "guest-e2e@example.com", language: "en" });
  }
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
