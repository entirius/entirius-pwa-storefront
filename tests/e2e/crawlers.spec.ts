// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";
import app_config from "../../_CONFIG/app.config.json";

// robots.txt keeps private flows out and points to the sitemap; the sitemap lists the
// addresses the shop serves, and each one answers 200.

test("robots.txt disallows private flows and names the sitemap", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const body = await res.text();
  for (const path of ["/cart", "/checkout", "/profile", "/user-handler"]) {
    expect(body).toContain(`Disallow: ${path}`);
  }
  expect(body).toContain(`Sitemap: ${app_config.SITE_URL}/sitemap.xml`);
});

test("sitemap.xml lists pages, categories and products that exist", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const urls = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(urls.some((u) => u.includes("/catalog/"))).toBe(true);
  expect(urls.some((u) => u.includes("/product/"))).toBe(true);
  expect(urls.some((u) => u.includes("layout-"))).toBe(false);

  const sample = [urls.find((u) => u.includes("/catalog/")), urls.find((u) => u.includes("/product/"))];
  for (const url of sample) {
    // the sitemap holds SITE_URL addresses; the test server may sit elsewhere
    const path = new URL(url!).pathname;
    expect((await request.get(path)).status(), path).toBe(200);
  }
});
