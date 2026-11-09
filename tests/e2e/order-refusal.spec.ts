// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";
import { fill_address } from "./support/checkout";

// `POST orders/` answers 409 with a reason code when the cart cannot become an order (checkout 10.1). The real
// refusals need a cart broken behind the checkout's back (a sold-out item, an expired code, another tab), so the
// answers are stubbed: one trip through the checkout, then one refusal per click of the order button. Nothing is
// ordered.

const PRODUCT = "/product/flight-deck-command-chair";
const API_TEXT = "English text from the API";

test("a refused order says why and leads to where it is fixed", async ({ page }) => {
  await page.goto(PRODUCT);
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.locator("header").getByRole("link", { name: /^Cart, 1 item$/ }).click();
  await page.getByRole("complementary", { name: "Order summary" }).getByRole("link", { name: "Go to checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  await fill_address(page);
  const to_shipping = page.getByRole("button", { name: "Continue to shipping" });
  await expect(to_shipping).toBeEnabled();
  await to_shipping.click();
  await page.getByRole("radiogroup").getByRole("radio").first().click();
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await page.getByRole("radiogroup").getByText(/bank transfer/i).click();
  await page.getByRole("button", { name: "Continue to review" }).click();

  const place = page.getByRole("button", { name: "Order with obligation to pay" });
  await expect(place).toBeVisible();
  const required = page.locator("[data-agreement-required]");
  await expect(required.first()).toBeVisible();
  for (const agreement of await required.all()) await agreement.getByRole("checkbox").click();
  await expect(place).toBeEnabled();

  const refusals = ["OUT_OF_STOCK", "DISCOUNT_EXPIRED", "UNPROCESSABLE_ENTITY", "ADDRESSES_NOT_SELECTED"];
  await page.route(/\/checkout\/v2\/[^/]+\/orders\/(\?|$)/, (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 409,
          json: { error: refusals.shift(), message: API_TEXT, debug_id: "e2e", details: [] },
        })
      : route.fallback(),
  );
  const view_cart = page.getByRole("link", { name: "View cart" });
  const go_to = page.getByRole("button", { name: /^Go to / });

  // A sold-out item: to the cart, where its line says so.
  await place.click();
  await expect(page.getByText("Something in your cart is out of stock. Check your cart and place the order again.")).toBeVisible();
  await expect(view_cart).toHaveAttribute("href", /\/cart$/);

  // A discount code that expired meanwhile: to the cart and its code form.
  await place.click();
  await expect(
    page.getByText("A discount code in your cart can no longer be used. Check your cart and place the order again."),
  ).toBeVisible();
  await expect(view_cart).toBeVisible();

  // A code the shop does not know: the generic message, nothing to go to.
  await place.click();
  await expect(page.getByText("Couldn’t place your order. Please try again.")).toBeVisible();
  await expect(view_cart).toHaveCount(0);
  await expect(go_to).toHaveCount(0);

  // A missing address (the cart lost it in another tab): back to the address step in one click.
  await place.click();
  await expect(page.getByText("Your order has no address yet. Add it and place the order again.")).toBeVisible();
  await page.getByRole("button", { name: "Go to address" }).click();
  await expect(page.getByRole("button", { name: "Continue to shipping" })).toBeVisible();

  await expect(page.getByText(API_TEXT)).toHaveCount(0);
});
