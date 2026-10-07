// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// The storefront wears @entirius/brand-tokens through the semantic layer in
// app/globals.css: the light set by default (THEME in _CONFIG/app.config.json picks
// the dark one), no theme toggle. Expected values are the brand tokens of the
// pinned package version (light.neutral-100 #F4F5F7, accent-fill #0E7C86).

test("pages use the light brand theme from the tokens", async ({ page }) => {
  await page.goto("/product/flight-deck-command-chair");

  await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(244, 245, 247)");

  // Primary button: filled accent surface with white text (WCAG AA 4.95:1).
  const add = page.getByRole("button", { name: "Add to cart" });
  await expect(add).toHaveCSS("background-color", "rgb(14, 124, 134)");
  await expect(add).toHaveCSS("color", "rgb(255, 255, 255)");
});

test("there is no theme toggle", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /theme/i })).toHaveCount(0);
});

test("brand typefaces: Lexend Deca headings (light, never bold), Inter UI", async ({ page }) => {
  await page.goto("/product/flight-deck-command-chair");
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toHaveCSS("font-family", /^"Lexend Deca"/);
  await expect(h1).toHaveCSS("font-weight", "300");
  await expect(page.locator("body")).toHaveCSS("font-family", /^Inter\b/);
  await expect(page.getByRole("button", { name: "Add to cart" })).toHaveCSS("font-family", /^Inter\b/);

  // No heading on the page is bold (styleguide: Lexend Deca 300/400 only).
  const weights = await page
    .locator("h1, h2, h3, h4")
    .evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n).fontWeight));
  expect(weights.filter((w) => Number(w) > 400)).toEqual([]);
});

test("cards are flat white surfaces, active wishlist heart is accent", async ({ page }) => {
  await page.goto("/catalog/chairs");
  const tile = page.locator('a[href^="/product/"]').first();
  await expect(tile).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(tile).toHaveCSS("background-image", "none");

  const heart = tile.getByRole("button").first();
  await heart.click();
  await expect(heart.locator("svg")).toHaveCSS("color", "rgb(14, 124, 134)");
});
