// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";
import app_config from "../../_CONFIG/app.config.json";

// Identity comes from config (_CONFIG/app.config.json + _CONFIG/brand/), never
// from code: the shop name in the header and the title, the favicon served by
// app/brand/[file], and nothing else readable through that route.

const { SITE_NAME, BRAND } = app_config;

test("header and title carry the configured shop identity", async ({ page }) => {
  await page.goto("/catalog/chairs");
  const home = page.locator("header").getByRole("link", { name: `${SITE_NAME} — home` });
  await expect(home).toBeVisible();
  if (BRAND.LOGO) {
    await expect(home.locator("img")).toHaveAttribute("src", `/brand/${BRAND.LOGO}`);
  } else {
    await expect(home).toHaveText(SITE_NAME);
  }
  await expect(page).toHaveTitle(new RegExp(`\\| ${SITE_NAME}$`));
  // No template leftovers.
  await expect(page.locator('img[src*="next.svg"]')).toHaveCount(0);
});

test("favicon is served from the config brand folder", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="icon"]').getAttribute("href");
  expect(href).toBe(`/brand/${BRAND.FAVICON}`);
  const res = await request.get(href!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/svg+xml");
});

test("the brand route serves only files listed in the config", async ({ request }) => {
  for (const path of ["/brand/app.config.json", "/brand/..%2Fapp.config.json", "/brand/missing.svg"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});
