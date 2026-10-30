// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";

// On a desktop the header's top row has a magnifier, not a field: a click spreads the field into the free space,
// the icons stay put, and the results open over the menu row. The phone keeps the sheet.

const PLACEHOLDER = "Search products and categories…";
const header = (page: Page) => page.locator("header").first();
const magnifier = (page: Page) => header(page).getByRole("button", { name: "Search", exact: true });

async function open_home(page: Page) {
  await page.goto("/");
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-slot="navigation-menu-trigger"]');
    return el && Object.keys(el).some((key) => key.startsWith("__reactProps"));
  });
}

test("the top row has no field until the magnifier is clicked", async ({ page }) => {
  await open_home(page);
  await expect(page.getByPlaceholder(PLACEHOLDER)).toHaveCount(0);
  const wishlist = header(page).getByRole("button", { name: "Wishlist", exact: true });
  const before = await wishlist.boundingBox();

  await magnifier(page).click();
  const field = page.getByPlaceholder(PLACEHOLDER);
  await expect(field).toBeFocused();
  await expect(magnifier(page)).toBeHidden();

  // Past the width transition.
  await page.waitForTimeout(300);
  const box = await field.boundingBox();
  expect(box!.width).toBeGreaterThan(200);
  expect(await wishlist.boundingBox()).toEqual(before);
});

test.describe("with the menu in its own row", () => {
  test.use({ viewport: { width: 1100, height: 720 } });

  test("the results cover the menu row, right under the top row", async ({ page }) => {
    await open_home(page);
    const sofas = await header(page).getByRole("button", { name: "Sofas", exact: true }).boundingBox();
    await magnifier(page).click();
    const field = page.getByPlaceholder(PLACEHOLDER);
    await field.fill("chair");
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("link", { name: "Show all results" })).toBeVisible();

    const covered = await page.evaluate(
      ({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest('[role="dialog"]')),
      { x: sofas!.x + sofas!.width / 2, y: sofas!.y + sofas!.height / 2 },
    );
    expect(covered).toBe(true);
    // The page behind stays usable: this is no modal.
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("the field stays clear of the logo", async ({ page }) => {
    await open_home(page);
    await magnifier(page).click();
    await page.waitForTimeout(300);
    const field = (await page.getByRole("search").boundingBox())!;
    const logo = (await header(page).getByRole("link", { name: /home$/ }).boundingBox())!;
    expect(field.x + field.width).toBeLessThanOrEqual(logo.x);
  });
});

test("with the menu in the top row the results start under it, and the field stays clear of the logo", async ({ page }) => {
  await open_home(page);
  await magnifier(page).click();
  await page.waitForTimeout(300);
  const field = (await page.getByRole("search").boundingBox())!;
  const logo = (await header(page).getByRole("link", { name: /home$/ }).boundingBox())!;
  expect(field.x).toBeGreaterThanOrEqual(logo.x + logo.width);
  await expect(header(page).getByRole("button", { name: "Sofas", exact: true })).toBeVisible();
  const top = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const panel = dialog?.querySelector(":scope > div:last-child");
    return panel?.getBoundingClientRect().top;
  });
  expect(top).toBeCloseTo((await header(page).boundingBox())!.height - 1, 0);
});

test("Escape closes the field, clears it and gives the focus back", async ({ page }) => {
  await open_home(page);
  await magnifier(page).click();
  await page.getByPlaceholder(PLACEHOLDER).fill("chair");
  await page.keyboard.press("Escape");
  await expect(page.getByPlaceholder(PLACEHOLDER)).toHaveCount(0);
  await expect(magnifier(page)).toBeFocused();

  await magnifier(page).click();
  await expect(page.getByPlaceholder(PLACEHOLDER)).toHaveValue("");
});

test("a click outside closes the field, the close button too", async ({ page }) => {
  await open_home(page);
  await magnifier(page).click();
  await expect(page.getByPlaceholder(PLACEHOLDER)).toBeFocused();
  await page.mouse.click(700, 800);
  await expect(page.getByPlaceholder(PLACEHOLDER)).toHaveCount(0);

  await magnifier(page).click();
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
  await expect(page.getByPlaceholder(PLACEHOLDER)).toHaveCount(0);
  await expect(magnifier(page)).toBeVisible();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the magnifier opens the sheet", async ({ page }) => {
    await page.goto("/");
    await magnifier(page).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder(PLACEHOLDER).fill("chair");
    await expect(dialog.getByRole("link", { name: "Show all results" })).toBeVisible();
  });
});
