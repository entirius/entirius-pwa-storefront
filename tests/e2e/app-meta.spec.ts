// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";
import app_config from "../../_CONFIG/app.config.json";

// Web app manifest, theme colour and default share image come from the optional BRAND keys of
// _CONFIG/app.config.json. With none of them set the page emits nothing of it.

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

  const share = page.locator('meta[property="og:image"]');
  if (BRAND.OG_IMAGE) await expect(share).toHaveAttribute("content", new RegExp(`/brand/${BRAND.OG_IMAGE}$`));
  else await expect(share).toHaveCount(0);
});
