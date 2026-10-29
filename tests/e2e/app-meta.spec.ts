// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";
import app_config from "../../_CONFIG/app.config.json";

// Web app manifest, theme colour and default share image come from the optional BRAND keys of
// _CONFIG/app.config.json. With none of them set the page emits no manifest and no theme colour, and
// shares the image generated from the shop name (app/og-image.png/route.tsx).

const BRAND = app_config.BRAND as Record<string, string | null | undefined>;
const has_icons = Boolean(BRAND.ICON_192 || BRAND.ICON_512 || BRAND.ICON_MASKABLE);

test("the manifest exists exactly when app icons are configured", async ({ page, request }) => {
  await page.goto("/catalog/chairs");
  const res = await request.get("/manifest.webmanifest");
  if (!has_icons) {
    expect(res.status()).toBe(404);
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(0);
    return;
  }
  expect(res.status()).toBe(200);
  const manifest = await res.json();
  expect(manifest.name).toBe(app_config.SITE_NAME);
  for (const icon of manifest.icons) {
    expect((await request.get(icon.src)).status(), icon.src).toBe(200);
  }
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
});

test("theme-color and the default share image follow the config", async ({ page }) => {
  await page.goto("/catalog/chairs");
  const theme = page.locator('meta[name="theme-color"]');
  if (BRAND.THEME_COLOR) await expect(theme).toHaveAttribute("content", BRAND.THEME_COLOR);
  else await expect(theme).toHaveCount(0);

  const share = BRAND.OG_IMAGE ? `/brand/${BRAND.OG_IMAGE}` : "/og-image.png";
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", new URL(share, app_config.SITE_URL).href);
});

test("the generated share image is a 1200×630 PNG", async ({ request }) => {
  const res = await request.get("/og-image.png");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  // PNG header: width and height are the big-endian words at bytes 16 and 20 (IHDR).
  const png = await res.body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
});
