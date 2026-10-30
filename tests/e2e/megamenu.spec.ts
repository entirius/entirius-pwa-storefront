// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";

// The desktop menu has its own header row: hover opens a panel, a mouse click leaves it alone, touch and keyboard
// toggle it. Every category offers the way to its collective page.
// Seed: Sofas > Living Room Sofas (> Corner Sofas, Straight Sofas), Sofa Beds.

const trigger = (page: Page, name: string) => page.locator("header").getByRole("button", { name, exact: true });
const panel = (page: Page) => page.locator('[data-slot="navigation-menu-viewport"]');

async function open_home(page: Page) {
  await page.goto("/");
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-slot="navigation-menu-trigger"]');
    return el && Object.keys(el).some((key) => key.startsWith("__reactProps"));
  });
}

async function center(page: Page, name: string) {
  const box = await trigger(page, name).boundingBox();
  if (!box) throw new Error(`no trigger ${name}`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

// A real pointer path: a straight line that takes `ms`.
async function glide(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, ms: number) {
  const steps = Math.max(2, Math.round(ms / 16));
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps);
    await page.waitForTimeout(ms / steps);
  }
}

test.describe("with a mouse", () => {
  test("hover opens the whole branch with one request, right under the row", async ({ page }) => {
    await open_home(page);
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("parent_url_key")) requests.push(request.url());
    });

    await trigger(page, "Sofas").hover();
    await expect(trigger(page, "Sofas")).toHaveCSS("cursor", "pointer");
    await expect(panel(page).getByRole("link", { name: "Corner Sofas" })).toBeVisible();
    await expect(panel(page).getByRole("link", { name: "Sofa Beds" })).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toContain("parent_url_key=sofas");

    const row = await trigger(page, "Sofas").boundingBox();
    const top = await panel(page).boundingBox();
    expect(top!.y - (row!.y + row!.height)).toBeLessThanOrEqual(1);
  });

  for (const wait of [0, 400]) {
    test(`a click ${wait} ms after arriving leaves the panel open`, async ({ page }) => {
      await open_home(page);
      const url = page.url();
      await trigger(page, "Sofas").hover();
      await page.waitForTimeout(wait);
      await page.mouse.down();
      await page.mouse.up();
      await page.waitForTimeout(400);
      await expect(trigger(page, "Sofas")).toHaveAttribute("data-state", "open");
      await expect(panel(page)).toBeVisible();
      expect(page.url()).toBe(url);
    });
  }

  for (const ms of [200, 500, 1000]) {
    test(`the way to the first link keeps the panel (${ms} ms)`, async ({ page }) => {
      await open_home(page);
      await trigger(page, "Sofas").hover();
      const link = panel(page).getByRole("link", { name: "Living Room Sofas" });
      await expect(link).toBeVisible();
      const box = await link.boundingBox();
      await glide(page, await center(page, "Sofas"), { x: box!.x + 20, y: box!.y + box!.height / 2 }, ms);
      await page.waitForTimeout(300);
      await expect(trigger(page, "Sofas")).toHaveAttribute("data-state", "open");
      await expect(link).toBeVisible();
    });
  }

  test("a quick pass over the neighbouring trigger does not switch the panel", async ({ page }) => {
    await open_home(page);
    await trigger(page, "Sofas").hover();
    await expect(panel(page).getByRole("link", { name: "Sofa Beds" })).toBeVisible();
    // Direct moves: a timed path would wait on the neighbour longer than the 120 ms it takes to switch on purpose.
    const neighbour = await center(page, "Chairs");
    await page.mouse.move(neighbour.x, neighbour.y);
    await page.mouse.move(neighbour.x, neighbour.y + 70);
    await page.waitForTimeout(300);
    await expect(trigger(page, "Sofas")).toHaveAttribute("data-state", "open");
    await expect(panel(page).getByRole("link", { name: "Sofa Beds" })).toBeVisible();
  });

  test("moving to another trigger switches the panel without a blink", async ({ page }) => {
    await open_home(page);
    await trigger(page, "Sofas").hover();
    await expect(panel(page).getByRole("link", { name: "Sofa Beds" })).toBeVisible();
    await page.evaluate(() => {
      const store = window as unknown as { __gone: number };
      store.__gone = 0;
      const tick = () => {
        // The trigger's state, not the panel's presence: a closing panel stays in the DOM for its exit animation.
        if (!document.querySelector('[data-slot="navigation-menu-trigger"][data-state="open"]')) store.__gone++;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await trigger(page, "Chairs").hover();
    await expect(trigger(page, "Chairs")).toHaveAttribute("data-state", "open");
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => (window as unknown as { __gone: number }).__gone)).toBe(0);
  });

  test("the panel leads to the collective category", async ({ page }) => {
    await open_home(page);
    await trigger(page, "Sofas").hover();
    await panel(page).getByRole("link", { name: "View all in Sofas" }).click();
    await expect(page).toHaveURL(/\/catalog\/sofas$/);
    await expect(page.getByRole("heading", { level: 1, name: "Sofas" })).toBeVisible();
    await expect(panel(page)).toHaveCount(0);
  });
});

test("the keyboard toggles the panel", async ({ page }) => {
  await open_home(page);
  await trigger(page, "Sofas").focus();
  await page.keyboard.press("Enter");
  await expect(trigger(page, "Sofas")).toHaveAttribute("data-state", "open");
  await expect(panel(page).getByRole("link", { name: "View all in Sofas" })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(trigger(page, "Sofas")).toHaveAttribute("data-state", "closed");
});

test.describe("on a tablet", () => {
  test.use({ hasTouch: true, viewport: { width: 1024, height: 768 } });

  test("a tap toggles the panel", async ({ page }) => {
    await open_home(page);
    await trigger(page, "Sofas").tap();
    await expect(trigger(page, "Sofas")).toHaveAttribute("data-state", "open");
    await expect(panel(page).getByRole("link", { name: "View all in Sofas" })).toBeVisible();
    await trigger(page, "Sofas").tap();
    await expect(trigger(page, "Sofas")).toHaveAttribute("data-state", "closed");
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("every level of the hamburger leads to its collective category", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "Sofas" }).click();
    await expect(sheet.getByRole("link", { name: "View all in Sofas" })).toHaveAttribute("href", /\/catalog\/sofas$/);

    await sheet.getByRole("button", { name: "Living Room Sofas" }).click();
    await sheet.getByRole("link", { name: "View all in Living Room Sofas" }).click();
    await expect(page).toHaveURL(/\/catalog\/living-room-sofas$/);
    await expect(sheet).toBeHidden();
  });
});
