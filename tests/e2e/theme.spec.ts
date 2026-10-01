import { expect, test } from "@playwright/test";

// The storefront wears @entirius/brand-tokens through the semantic layer in
// app/globals.css: dark only, no theme toggle. Expected values are the brand
// tokens of the pinned package version (black #0D0A09, accent-fill #0E7C86).

test("pages use the dark brand theme from the tokens", async ({ page }) => {
  await page.goto("/product/flight-deck-command-chair");

  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(13, 10, 9)");

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

test("cards sit on the brand card gradient, active wishlist heart is accent", async ({ page }) => {
  await page.goto("/catalog/chairs");
  const tile = page.locator('a[href^="/product/"]').first();
  await expect(tile).toHaveCSS("background-image", /linear-gradient/);

  const heart = tile.getByRole("button").first();
  await heart.click();
  await expect(heart.locator("svg")).toHaveCSS("color", "rgb(0, 172, 193)");
});
