// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";
import app_config from "../../_CONFIG/app.config.json";

// Product and category heads carry the fields of the transform layer (lib/seo/transforms.ts): a plain-text
// description, the product's own share picture, and Offer availability in JSON-LD.
// Seeded: nebula-crimson-sofa (in stock, 4 pictures), drone-dock-ottoman (sold out, 2 pictures).

async function json_ld(page: Page, type: string) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((b) => [JSON.parse(b)].flat()).find((d: { "@type"?: string }) => d["@type"] === type);
}

const meta = (page: Page, key: string) => page.locator(`meta[name="${key}"], meta[property="${key}"]`);

test("a product page has a plain-text description and its own share picture", async ({ page }) => {
  await page.goto("/product/nebula-crimson-sofa");
  const description = await meta(page, "description").getAttribute("content");
  expect(description?.length).toBeGreaterThan(0);
  expect(description!.length).toBeLessThanOrEqual(160);
  expect(description).not.toMatch(/</);

  await expect(meta(page, "og:image")).toHaveCount(1);
  await expect(meta(page, "og:image")).toHaveAttribute("content", /^https?:\/\/.+\/media\//);
  await expect(meta(page, "og:description")).toHaveAttribute("content", description!);
});

test("product JSON-LD has the description, pictures and availability", async ({ page }) => {
  await page.goto("/product/nebula-crimson-sofa");
  const product = await json_ld(page, "Product");
  expect(product.description).toBeTruthy();
  expect(product.image.length).toBeGreaterThan(0);
  for (const url of product.image) expect(url).toMatch(/^https?:\/\//);
  expect(product.offers.priceCurrency).toMatch(/^[A-Z]{3}$/);
  expect(product.offers.availability).toBe("https://schema.org/InStock");

  await page.goto("/product/drone-dock-ottoman");
  expect((await json_ld(page, "Product")).offers.availability).toBe("https://schema.org/OutOfStock");
});

test("a category page has its description in the head and in JSON-LD, and stays indexable", async ({ page }) => {
  await page.goto("/catalog/chairs");
  await expect(meta(page, "description")).toHaveAttribute("content", "Comfortable chairs for any room");
  expect((await json_ld(page, "CollectionPage")).description).toBe("Comfortable chairs for any room");
  await expect(meta(page, "robots")).toHaveCount(0);
});

test("the home page, and only the home page, names the shop as an Organization", async ({ page }) => {
  const logo = (app_config.BRAND as Record<string, string | null | undefined>).LOGO;
  await page.goto("/");
  const organization = await json_ld(page, "Organization");
  expect(organization).toMatchObject({ name: app_config.SITE_NAME, url: `${app_config.SITE_URL}/` });
  expect(organization.logo).toBe(logo ? `${app_config.SITE_URL}/brand/${logo}` : undefined);

  await page.goto("/catalog/chairs");
  expect(await json_ld(page, "Organization")).toBeUndefined();
});
