// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";
import { create_account, login, save_address, set_default_address, type BookAddress } from "./support/account";

// Checkout address step. Signed in, a cart without an address starts from the default address-book entry and
// the profile's email; one line above each block opens the book in a sheet, picking an entry fills the block
// (a company entry with its invoice data). Postal code and phone follow the country (guest form). No order
// is placed.

const HOME: BookAddress = {
  firstname: "Anna",
  lastname: "Tester",
  street: "Testowa 1",
  city: "Warsaw",
  postcode: "00-001",
  country_code: "PL",
  dialling_code: "+48",
  telephone: "600100200",
  is_company: false,
  company: null,
  tax_id: null,
};
const OFFICE: BookAddress = {
  ...HOME,
  street: "Friedrichstrasse 43",
  city: "Berlin",
  postcode: "10115",
  country_code: "DE",
  dialling_code: "+49",
  telephone: "30901820",
  is_company: true,
  company: "Tester GmbH",
  tax_id: "DE123456789",
};

async function to_checkout(page: Page) {
  await page.goto("/product/flight-deck-command-chair");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.locator("header").getByRole("link", { name: /^Cart, 1 item$/ })).toBeVisible();
  await page.goto("/checkout");
  await expect(page.getByRole("button", { name: "Continue to shipping" })).toBeEnabled();
}

test("signed in: the default address fills the step and the book sheet swaps it", async ({ page, request }) => {
  const email = await create_account(request);
  await save_address(request, email, HOME);
  await set_default_address(request, email, await save_address(request, email, OFFICE));
  await login(page, email);
  await to_checkout(page);

  const billing = page.getByRole("group", { name: "Billing details" });
  await expect(billing.getByLabel("Email")).toHaveValue(email);
  await expect(billing.getByLabel("Street and number")).toHaveValue("Friedrichstrasse 43");
  await expect(billing.getByLabel("Postal code")).toHaveValue("10115");
  await expect(page.getByLabel("Request a VAT invoice")).toBeChecked();
  await expect(page.getByLabel("Company")).toHaveValue("Tester GmbH");

  // One line in the form; the entries live in the sheet.
  const book = billing.getByRole("button", { name: /Friedrichstrasse 43, 10115 Berlin.*Change/ });
  await expect(book).toBeVisible();
  await expect(page.getByRole("radiogroup")).toHaveCount(0);

  await book.click();
  const sheet = page.getByRole("dialog", { name: "Saved addresses" });
  await expect(sheet.getByRole("radio", { name: /Friedrichstrasse 43/ })).toBeChecked();
  await sheet.getByRole("radio", { name: /Testowa 1/ }).click();
  await expect(sheet).toBeHidden();

  await expect(billing.getByLabel("Street and number")).toHaveValue("Testowa 1");
  await expect(billing.getByLabel("Postal code")).toHaveValue("00-001");
  await expect(page.getByLabel("Request a VAT invoice")).not.toBeChecked();
  // The whole block changed at once: no rule saw the old country.
  await expect(billing.locator('[data-slot="form-message"]')).toHaveCount(0);

  // An edited block is no longer the book entry.
  await billing.getByLabel("Street and number").fill("Testowa 2");
  await expect(billing.getByRole("button", { name: "Choose a saved address" })).toBeVisible();

  await page.getByRole("button", { name: "Continue to shipping" }).click();
  await expect(page.getByRole("button", { name: "Continue to payment" })).toBeVisible();
});

test("postal code and phone follow the country", async ({ page }) => {
  await to_checkout(page);
  const billing = page.getByRole("group", { name: "Billing details" });
  // A guest has no address book.
  await expect(billing.getByRole("button", { name: "Choose a saved address" })).toHaveCount(0);

  // The step validates a field when it is left (mode onBlur): Tab out of each one.
  const type = async (label: string, value: string) => {
    await billing.getByLabel(label).fill(value);
    await billing.getByLabel(label).press("Tab");
  };

  await billing.getByRole("combobox", { name: "Country" }).click();
  await page.getByRole("option", { name: "Poland" }).click();
  await expect(billing.getByText("For example 00-001")).toBeVisible();
  await type("Postal code", "00001");
  await type("Phone number", "6001");
  await expect(billing.getByText("Enter a postal code in this country’s format")).toBeVisible();
  await expect(billing.getByText("Enter a valid phone number")).toBeVisible();

  // Germany: five digits, and a Berlin number with +49.
  await billing.getByRole("combobox", { name: "Country" }).click();
  await page.getByRole("option", { name: "Germany" }).click();
  await expect(billing.getByText("For example 10115")).toBeVisible();
  await expect(billing.getByRole("combobox", { name: "Code" })).toHaveText("+49");
  await type("Postal code", "10115");
  await type("Phone number", "30901820");
  await expect(billing.getByText("Enter a postal code in this country’s format")).toBeHidden();
  await expect(billing.getByText("Enter a valid phone number")).toBeHidden();
});
