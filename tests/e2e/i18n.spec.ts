// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";
import app_config from "../../_CONFIG/app.config.json";

// The interface language is the `lg` cookie (the proxy keeps an existing one). The
// default country lists pl next to en, so a Polish visitor gets Polish text and
// prices formatted the Polish way, while the API data (product names) stays as sent.

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "lg", value: "pl", url: app_config.SITE_URL }]);
});

test("product page in Polish", async ({ page }) => {
  await page.goto("/product/flight-deck-command-chair");
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  const details = page.getByRole("region", { name: "Szczegóły produktu" });
  await expect(details.getByText("z VAT")).toBeVisible();
  // Intl puts a no-break space before the currency symbol.
  await expect(details.getByText(/^\d+,\d{2} €$/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Dodaj do koszyka" })).toBeEnabled();
});

test("catalog and empty cart in Polish", async ({ page }) => {
  await page.goto("/catalog/chairs");
  const filters = page.getByRole("complementary", { name: "Filtry" });
  await expect(filters.getByRole("heading", { name: "Sortowanie" })).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Twój koszyk" })).toBeVisible();
  await expect(page.getByText("Twój koszyk jest pusty")).toBeVisible();
});

// Category url keys belong to a language (`chairs` / `krzesla`): an address with another language's key goes to
// the active one's, and the menu's configured keys are turned into it too.
test("a category address and the menu follow the language's url keys", async ({ page }) => {
  const response = await page.goto("/catalog/chairs");
  expect(response?.request().redirectedFrom()?.url()).toMatch(/\/catalog\/chairs$/);
  await expect(page).toHaveURL(/\/catalog\/krzesla$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Krzesła");

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("listitem").first()).toHaveText("Krzesła");
});

test("a crawler without cookies reads a category in the profile's language", async ({ browser }) => {
  const context = await browser.newContext(); // no `lg` cookie
  const page = await context.newPage();
  await page.goto("/catalog/krzesla");
  await expect(page).toHaveURL(/\/catalog\/chairs$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await context.close();
});
