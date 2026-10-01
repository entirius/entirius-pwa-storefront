import { expect, test } from "@playwright/test";

// Range prices (CONFIGURABLE) show the lowest price, products without a price
// (CUSTOM) say so, and neither can be added to the cart. Seeded products:
// captains-living-room-set (CONFIGURABLE, is_range), chief-engineers-custom-throne
// (CUSTOM, price: null).

test("catalog tiles never show an empty price", async ({ page }) => {
  await page.goto("/catalog/chairs");
  const tiles = page.locator('a[href^="/product/"]');
  await expect(tiles.first()).toBeVisible();
  await expect(tiles.filter({ hasText: "—" })).toHaveCount(0);
  await expect(
    tiles.filter({ hasText: "Chief Engineer's Custom Throne" }),
  ).toContainText("Price on request");
});

test("range-priced product shows its lowest price and cannot be bought", async ({ page }) => {
  await page.goto("/product/captains-living-room-set");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/^From \d+(\.\d+)? EUR$/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Not available online" })).toBeDisabled();
});

test("product without a price shows price on request and cannot be bought", async ({ page }) => {
  await page.goto("/product/chief-engineers-custom-throne");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Price on request")).toBeVisible();
  await expect(page.getByRole("button", { name: "Not available online" })).toBeDisabled();
});

test("search results show range prices", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search products and categories…").fill("living room set");
  const row = page.locator('a[href="/product/captains-living-room-set"]');
  await expect(row).toContainText(/From \d+(\.\d+)? EUR/);
});
