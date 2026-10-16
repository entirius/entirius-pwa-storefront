// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";
import app_config from "../../_CONFIG/app.config.json";

// The cart never asks for more than the real-time stock: a quantity stored in an earlier session
// (when the stock was higher) is lowered on the cart page, and the stepper stops at the stock.
// No order is placed, so no stock is used.

const SKU = "ENT-C002";

test("the cart page lowers a stored quantity to the stock and stops the stepper there", async ({ page, request }) => {
  const response = await request.get(`${app_config.API_BASE_URL}/api/matrix/v2/default-europe/stock/`, {
    params: { sku: SKU },
  });
  const stock: number = (await response.json())[SKU].quantity;
  expect(stock).toBeGreaterThan(0);

  await page.addInitScript(
    ([sku, quantity]) => {
      const item = { sku, name: "Docking Bay Chair", url_key: "docking-bay-chair", price: null, media: [], quantity };
      if (!localStorage.getItem("CART")) localStorage.setItem("CART", JSON.stringify({ [sku as string]: item }));
    },
    [SKU, stock + 5] as const,
  );
  await page.goto("/cart");

  const lines = page.getByRole("region", { name: "Items in your cart" });
  await expect(lines.getByText(String(stock), { exact: true })).toBeVisible();
  await expect(lines.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
});
