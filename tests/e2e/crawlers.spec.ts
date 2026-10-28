// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";
import app_config from "../../_CONFIG/app.config.json";

// robots.txt keeps private flows out and points to the sitemap; the sitemap lists the
// addresses the shop serves, and each one answers 200 under its canonical address.

test("robots.txt disallows private flows and names the sitemap", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const body = await res.text();
  for (const path of ["/cart", "/checkout", "/profile", "/user-handler", "/reset-password", "/search"]) {
    expect(body).toContain(`Disallow: ${path}`);
  }
  expect(body).toContain(`Sitemap: ${app_config.SITE_URL}/sitemap.xml`);
});

test("sitemap.xml lists pages, categories, products and blog posts that exist", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const urls = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(urls.some((u) => u.includes("/catalog/"))).toBe(true);
  expect(urls.some((u) => u.includes("/product/"))).toBe(true);
  expect(urls.some((u) => u.endsWith("/blog/ai-in-e-commerce"))).toBe(true);
  expect(urls.some((u) => new URL(u).pathname === "/blog")).toBe(true);
  expect(urls.some((u) => u.endsWith("/blog/authors/anna-kowalska"))).toBe(true);
  expect(urls.some((u) => u.includes("layout-"))).toBe(false);
  expect(urls.some((u) => new URL(u).pathname.startsWith("/default/"))).toBe(false);

  const sample = [
    urls.find((u) => u.includes("/catalog/")),
    urls.find((u) => u.includes("/product/")),
    urls.find((u) => u.includes("/blog/") && !u.includes("/authors/")),
    urls.find((u) => u.includes("/blog/authors/")),
  ];
  for (const url of sample) {
    // the sitemap holds SITE_URL addresses; the test server may sit elsewhere
    const path = new URL(url!).pathname;
    const page = await request.get(path);
    expect(page.status(), path).toBe(200);
    // one address per page: the sitemap lists what the page declares canonical
    expect(await page.text(), path).toContain(`<link rel="canonical" href="${url}"/>`);
  }
});

// hreflang: an address's alternates as the sitemap lists them and as the page declares them.
const sitemap_alternates = (entry: string) =>
  Object.fromEntries([...entry.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
const page_alternates = (html: string) =>
  Object.fromEntries([...html.matchAll(/<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"\/>/g)].map((m) => [m[1], m[2]]));

test("a page declares the same language alternates as the sitemap lists for it", async ({ request }) => {
  const entries = [...(await (await request.get("/sitemap.xml")).text()).matchAll(/<url>([\s\S]*?)<\/url>/g)].map(
    (m) => m[1],
  );
  for (const kind of ["/catalog/", "/product/"]) {
    // one with alternates when the config has several profiles sharing the page, else any
    const of_kind = entries.filter((e) => e.includes(kind));
    const entry = of_kind.find((e) => e.includes("hreflang")) ?? of_kind[0];
    const url = entry.match(/<loc>([^<]+)<\/loc>/)![1];
    const path = new URL(url).pathname;
    const expected = sitemap_alternates(entry);
    expect(page_alternates(await (await request.get(path)).text()), path).toEqual(expected);
    // each alternate answers 200 and points back with the same set
    for (const alternate of Object.values(expected)) {
      const res = await request.get(new URL(alternate).pathname);
      expect(res.status(), alternate).toBe(200);
      expect(page_alternates(await res.text()), alternate).toEqual(expected);
    }
  }
});

test("the default profile has one address: /default/... is sent to the address without a prefix", async ({
  request,
}) => {
  for (const [from, to] of [
    ["/default/catalog/chairs?s_sort=price", "/catalog/chairs?s_sort=price"],
    ["/default", "/"],
  ]) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(301);
    const location = new URL(res.headers().location, "http://x");
    expect(location.pathname + location.search, from).toBe(to);
  }
});
