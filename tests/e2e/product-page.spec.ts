// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// Product page: swipe gallery with a full-screen viewer, related in-stock products, the sticky buy bar on
// phones, no stepper for a single piece, specification values linking into the catalog.
// Seeded: nebula-crimson-sofa (in stock, 4 pictures), drone-dock-ottoman (sold out, 2 pictures; in stock in
// its category: cargo-pod-ottoman, satellite-ottoman), zero-g-recliner (in stock, filterable attributes).

const PHONE = { width: 390, height: 844 };

test.describe("gallery", () => {
  test("phone: a swipe row with a counter, no thumbnails", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/product/nebula-crimson-sofa");
    const gallery = page.locator("[data-gallery]");
    await expect(gallery.locator("[data-gallery-counter]")).toHaveText("1 / 4");
    await expect(gallery.locator("[data-gallery-thumb]").first()).toBeHidden();

    // Retried: a scroll made before hydration is not seen by the counter.
    await expect(async () => {
      await gallery.locator("button img").first().evaluate((img) => {
        img.closest("div")!.scrollTo({ left: img.closest("div")!.clientWidth * 2 });
      });
      await expect(gallery.locator("[data-gallery-counter]")).toHaveText("3 / 4", { timeout: 500 });
    }).toPass();
  });

  test("desktop: thumbnails move the row, the first picture loads eagerly", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/product/nebula-crimson-sofa");
    const gallery = page.locator("[data-gallery]");
    await expect(gallery.locator("[data-gallery-thumb]")).toHaveCount(4);
    await expect(gallery.locator("[data-gallery-counter]")).toBeHidden();
    await expect(gallery.locator("button img").first()).toHaveAttribute("loading", "eager");
    await expect(gallery.locator("button img").nth(1)).toHaveAttribute("loading", "lazy");

    // Retried: a click made before hydration does nothing.
    await expect(async () => {
      await gallery.locator("[data-gallery-thumb]").nth(2).click();
      await expect(gallery.locator("[data-gallery-thumb]").nth(2)).toHaveAttribute("aria-current", "true", { timeout: 500 });
    }).toPass();
  });

  test("a click opens the full-screen viewer, Escape closes it", async ({ page }) => {
    await page.goto("/product/nebula-crimson-sofa");
    await page.locator("[data-gallery] button img").first().click();
    const viewer = page.locator("[data-gallery-viewer]");
    await expect(viewer).toBeVisible();
    await expect(viewer.getByRole("button", { name: "Close" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(viewer).toHaveCount(0);
  });

  test("viewer keys move the viewer only and keep working on the first picture", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/product/nebula-crimson-sofa");
    await page.locator("[data-gallery] button img").first().click();
    const viewer = page.locator("[data-gallery-viewer]");
    const counter = viewer.getByText(/^\d+ \/ 4$/);
    const next = viewer.getByRole("button", { name: "Next slide" });
    await next.click();
    await expect(counter).toHaveText("2 / 4");
    await next.click();
    await expect(counter).toHaveText("3 / 4");
    // The keys reached the gallery behind too, which pulled the viewer back to its own picture.
    await page.keyboard.press("ArrowRight");
    await expect(counter).toHaveText("4 / 4");

    // The Previous button leaves on the first picture; the keys must still reach the viewer.
    const previous = viewer.getByRole("button", { name: "Previous slide" });
    for (const at of ["3 / 4", "2 / 4", "1 / 4"]) {
      await previous.click();
      await expect(counter).toHaveText(at);
    }
    await page.keyboard.press("Escape");
    await expect(viewer).toHaveCount(0);
    await expect(page.locator("[data-gallery] button[aria-label]").first()).toBeFocused();
  });
});

test.describe("related products", () => {
  test("an in-stock product closes the page with in-stock tiles, never itself", async ({ page }) => {
    await page.goto("/product/nebula-crimson-sofa");
    const related = page.locator("[data-related-products]");
    await expect(related.getByRole("heading", { name: "Similar products" })).toBeVisible();
    const tiles = related.locator("[data-product-tile]");
    expect(await tiles.count()).toBeGreaterThan(0);
    await expect(related.locator('[data-stock="out"]')).toHaveCount(0);
    await expect(related.locator('a[href="/product/nebula-crimson-sofa"]')).toHaveCount(0);
    // After the product's own card, not inside it.
    await expect(page.getByRole("region", { name: "Product details" }).locator("[data-related-products]")).toHaveCount(0);
  });

  test("a sold-out product shows them right under the buy area", async ({ page }) => {
    await page.goto("/product/drone-dock-ottoman");
    const card = page.getByRole("region", { name: "Product details" });
    const related = card.locator("[data-related-products]");
    await expect(related).toBeVisible();
    await expect(related.locator("[data-related-lead]")).toBeVisible();
    await expect(related.locator('a[href="/product/cargo-pod-ottoman"]')).toBeVisible();
    await expect(related.locator('a[href="/product/drone-dock-ottoman"]')).toHaveCount(0);
    await expect(related.locator('[data-stock="out"]')).toHaveCount(0);
  });
});

test.describe("sticky buy bar (phone)", () => {
  test.use({ viewport: PHONE });

  test("slides in with the price and Add to cart once the buy area is out of view", async ({ page }) => {
    await page.goto("/product/nebula-crimson-sofa");
    const bar = page.locator("[data-buy-bar]");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(bar).toHaveAttribute("data-shown", "");
    await expect(bar.getByRole("button", { name: "Add to cart" })).toBeEnabled();
    // The buy area back in view: the bar leaves again.
    await page.locator("[data-buy-area]").evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect(bar).not.toHaveAttribute("data-shown", "");
  });

  test("sold out: offers the similar products instead", async ({ page }) => {
    await page.goto("/product/drone-dock-ottoman");
    const bar = page.locator("[data-buy-bar]");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(bar).toHaveAttribute("data-shown", "");
    await expect(bar.getByRole("button", { name: "Add to cart" })).toHaveCount(0);
    await expect(bar.getByRole("link", { name: "See similar" })).toHaveAttribute("href", "#related-products");
  });
});

test.describe("single piece", () => {
  const stock = (quantity: number) => async (route: import("@playwright/test").Route) => {
    const sku = new URL(route.request().url()).searchParams.get("sku");
    await route.fulfill({ json: { data: { [sku!]: { quantity, is_in_stock: true } } } });
  };

  test("no quantity stepper when exactly one piece is left", async ({ page }) => {
    await page.route(/\/stock\/\?/, stock(1));
    await page.goto("/product/nebula-crimson-sofa");
    await expect(page.getByRole("button", { name: "Add to cart" }).first()).toBeEnabled();
    await expect(page.getByRole("button", { name: "Increase quantity" })).toHaveCount(0);
  });

  test("the stepper stays for several pieces", async ({ page }) => {
    await page.route(/\/stock\/\?/, stock(5));
    await page.goto("/product/nebula-crimson-sofa");
    await expect(page.getByRole("button", { name: "Increase quantity" })).toBeEnabled();
  });
});

test("specification values that are catalog filters link to the filtered listing", async ({ page }) => {
  await page.goto("/product/zero-g-recliner");
  const specs = page.getByRole("region", { name: "Specifications" });
  await expect(specs.getByRole("link", { name: "Heliox Works" })).toHaveAttribute("href", "/catalog/chairs?q_series=heliox");
  await expect(specs.getByRole("link", { name: "Nano-Chrome" })).toHaveAttribute("href", "/catalog/chairs?q_options=nano-chrome");
  // A value that is no filter stays plain text.
  await expect(specs.getByRole("link", { name: "35" })).toHaveCount(0);
});

test("catalog: pagination above and below the list, no single-piece label by default", async ({ page }) => {
  await page.goto("/catalog/sofas?limit=4");
  const list = page.locator("[data-catalog-list]");
  await expect(list.locator("[data-product-tile]").first()).toBeVisible();
  await expect(list.getByRole("navigation", { name: "pagination" })).toHaveCount(2);
  await expect(page.locator("[data-single-piece]")).toHaveCount(0);

  await list.getByRole("navigation", { name: "pagination" }).last().getByRole("link", { name: /next/i }).click();
  await expect(page).toHaveURL(/page=2/);
});
