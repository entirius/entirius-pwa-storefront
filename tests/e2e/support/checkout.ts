// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, type Page } from "@playwright/test";

export const GUEST_EMAIL = "guest-e2e@example.com";

// The guest's address on the checkout address step. Typed in, not filled by the DEBUG "Fill test data" button, so
// the specs hold with DEBUG_MODE off. Poland, not Germany: in July the backend served shipping methods for DE only.
export async function fill_address(page: Page) {
  const form = page.locator("main form");
  await form.getByLabel("Email").fill(GUEST_EMAIL);
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
