// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";
import app_config from "../../_CONFIG/app.config.json";
import channels from "../../_CONFIG/channels.config.json";

// The country list of the checkout address comes from the checkout channel, not from a fixed list.
// No order is placed.

test("the address form offers the countries of the checkout channel", async ({ page, request }) => {
  const response = await request.get(`${app_config.API_BASE_URL}/api/checkout/v2/default-europe/countries/`, {
    headers: { "x-api-key": (channels as Record<string, { API_CHECKOUT_KEY: string }>)["default-europe"].API_CHECKOUT_KEY },
  });
  const expected: string[] = (await response.json()).countries.map((c: { label: string }) => c.label).sort();

  await page.goto("/product/flight-deck-command-chair");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/checkout");
  await page.locator("form").getByRole("combobox", { name: "Country" }).click();
  await expect(page.getByRole("option")).toHaveText(expected);
});
