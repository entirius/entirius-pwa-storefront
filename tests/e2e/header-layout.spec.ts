// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";

// The header's layouts. The reference config has two categories, a short list: one row from 1280 px up, two below,
// the logo in the centre of both. A long list always gets two rows (menu_fits_top_row, tested on its own).

const header = (page: Page) => page.locator("header").first();
const logo = (page: Page) => header(page).getByRole("link", { name: /home$/ });
const button = (page: Page, name: string) => header(page).getByRole("button", { name, exact: true });

async function x_center(page: Page) {
  const box = await logo(page).boundingBox();
  return box!.x + box!.width / 2;
}

test.describe("from 1280 px up, with a short list", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("the menu shares one row with the centred logo", async ({ page }) => {
    await page.goto("/");
    const height = (await header(page).boundingBox())!.height;
    expect(height).toBeLessThan(80);
    expect(Math.abs((await x_center(page)) - 640)).toBeLessThanOrEqual(1);

    const sofas = (await button(page, "Sofas").boundingBox())!;
    const logo_box = (await logo(page).boundingBox())!;
    expect(sofas.x + sofas.width).toBeLessThan(logo_box.x);
    // Every action sits to the right of the logo, the cart last.
    const search = (await button(page, "Search").boundingBox())!;
    const cart = (await header(page).getByRole("link", { name: "Cart", exact: true }).boundingBox())!;
    expect(search.x).toBeGreaterThan(logo_box.x + logo_box.width);
    expect(cart.x).toBeGreaterThan(search.x);
  });

  test("the panel opens under the row, its text lined up with the menu", async ({ page }) => {
    await page.goto("/");
    const chairs = button(page, "Chairs");
    await expect(async () => {
      await page.mouse.move(10, 500);
      await button(page, "Sofas").hover();
      await expect(page.getByRole("link", { name: "View all in Sofas" })).toBeVisible({ timeout: 1000 });
    }).toPass();
    // Past the panel's opening animation, which scales it.
    await page.waitForTimeout(400);
    const link = (await page.getByRole("link", { name: "View all in Sofas" }).boundingBox())!;
    const first = (await chairs.boundingBox())!;
    // The link's own padding is 8 px.
    expect(Math.abs(link.x + 8 - first.x)).toBeLessThanOrEqual(1);
    expect(link.y).toBeGreaterThan((await header(page).boundingBox())!.height);
  });
});

test.describe("below 1280 px", () => {
  test.use({ viewport: { width: 1100, height: 720 } });

  test("the menu takes its own row under the centred logo", async ({ page }) => {
    await page.goto("/");
    const height = (await header(page).boundingBox())!.height;
    expect(height).toBeGreaterThan(100);
    expect(height).toBeLessThan(115);
    expect(Math.abs((await x_center(page)) - 550)).toBeLessThanOrEqual(1);

    const logo_box = (await logo(page).boundingBox())!;
    const sofas = (await button(page, "Sofas").boundingBox())!;
    expect(sofas.y).toBeGreaterThanOrEqual(logo_box.y + logo_box.height);
    // Search, language and currency left of the logo, the rest right of it.
    const search = (await button(page, "Search").boundingBox())!;
    const wishlist = (await button(page, "Wishlist").boundingBox())!;
    expect(search.x + search.width).toBeLessThan(logo_box.x);
    expect(wishlist.x).toBeGreaterThan(logo_box.x + logo_box.width);
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the logo stays on the left and the locale switch moves into the menu", async ({ page }) => {
    await page.goto("/");
    expect((await logo(page).boundingBox())!.x).toBeLessThanOrEqual(16);
    await expect(header(page).getByRole("combobox")).toHaveCount(0);
    await page.getByRole("button", { name: "Menu" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("combobox", { name: "Language" })).toContainText("English");
    await expect(sheet.getByRole("combobox", { name: "Currency" })).toContainText("EUR");
  });
});

test("language and currency are icons that keep working", async ({ page }) => {
  await page.goto("/");
  const language = header(page).getByRole("combobox", { name: "Language" });
  const currency = header(page).getByRole("combobox", { name: "Currency" });
  await expect(language).toBeVisible();
  await expect(currency).toBeVisible();
  expect((await language.boundingBox())!.width).toBe(36);
  expect((await language.locator("svg").first().boundingBox())!.width).toBe(20);
  // The value stays for screen readers, out of sight.
  await expect(language).toContainText("English");
  await expect(currency).toContainText("EUR");
  const value_width = await language.locator('[data-slot="select-value"]').evaluate((el) => el.parentElement!.getBoundingClientRect().width);
  expect(value_width).toBeLessThanOrEqual(1);

  await expect(async () => {
    await language.click();
    await expect(page.getByRole("option", { name: "Polish" })).toBeVisible({ timeout: 1000 });
  }).toPass();
  await page.getByRole("option", { name: "Polish" }).click();
  await expect(button(page, "Szukaj")).toBeVisible();
});
