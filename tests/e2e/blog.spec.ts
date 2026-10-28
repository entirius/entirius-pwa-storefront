// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";
import app_config from "../../_CONFIG/app.config.json";

// The blog from the seeded ContentDB (`blog-post`, English only): the list with its CMS intro and category tabs, a
// post (heading, byline, table of contents, authors, neighbours, structured data), an author's page; unknown
// addresses answer 404.
// Seeded: 6 posts in 4 categories; ai-in-e-commerce (three authors, Technology) between getting-started and
// sustainable-shopping; anna-kowalska writes 2 of them.

const POST = "/blog/ai-in-e-commerce";

async function json_ld(page: Page, type: string) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((b) => [JSON.parse(b)].flat()).find((d: { "@type"?: string }) => d["@type"] === type);
}

test("a blog post shows its heading, byline, contents and authors", async ({ page }) => {
  await page.goto(POST);
  await expect(page.getByRole("heading", { level: 1, name: "AI in E-Commerce" })).toBeVisible();
  await expect(page.getByText("Anna Kowalska, Tomasz Kwiatkowski, and Ewa Lewandowska")).toBeVisible();
  await expect(page.locator("article time").first()).toHaveAttribute("datetime", /^2025-01-20/);
  await expect(page.getByText("Unknown CMS component")).toHaveCount(0);

  // Every entry of the table of contents leads to its heading.
  const toc = page.getByRole("navigation", { name: "Contents" });
  await expect(toc.getByRole("link")).toHaveText([
    "Machine Learning in Product Discovery",
    "Real-World Impact",
    "Getting Started with AI",
  ]);
  await toc.getByRole("link", { name: "Real-World Impact" }).click();
  await expect(page).toHaveURL(/#real-world-impact$/);
  await expect(page.getByRole("heading", { level: 2, name: "Real-World Impact" })).toBeInViewport();

  const authors = page.locator("section").filter({ has: page.getByRole("heading", { name: "About the authors" }) });
  await expect(authors.getByText("Editor in Chief")).toBeVisible();
});

test("a blog post links its older and newer neighbours", async ({ page }) => {
  await page.goto(POST);
  const neighbours = page.getByRole("navigation", { name: "More articles" });
  await expect(neighbours.getByRole("link", { name: /Previous article/ })).toHaveAttribute(
    "href",
    /\/blog\/getting-started$/,
  );
  await neighbours.getByRole("link", { name: /Next article/ }).click();
  await expect(page).toHaveURL(/\/blog\/sustainable-shopping$/);
  await expect(page.getByRole("heading", { level: 1, name: "Sustainable Shopping" })).toBeVisible();
});

test("a blog post is an article to crawlers", async ({ page }) => {
  await page.goto(POST);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute("content", /^2025-01-20/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${app_config.SITE_URL}${POST}`);

  expect(await json_ld(page, "BlogPosting")).toMatchObject({
    headline: "AI in E-Commerce",
    articleSection: "Technology",
    url: `${app_config.SITE_URL}${POST}`,
  });
  const trail = await json_ld(page, "BreadcrumbList");
  expect(trail.itemListElement.map((item: { name: string }) => item.name)).toEqual(["Blog", "AI in E-Commerce"]);
});

test("an unknown blog post or author answers 404", async ({ request }) => {
  expect((await request.get("/blog/no-such-post")).status()).toBe(404);
  expect((await request.get("/blog/authors/no-such-author")).status()).toBe(404);
});

test("the blog lists the posts newest first under the CMS intro, a tab per category", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1, name: "Blog" })).toBeAttached();
  await expect(page.getByText("Entirius Blog").first()).toBeVisible();
  const tiles = page.locator("[data-blog-posts] > li");
  await expect(tiles).toHaveCount(6);
  await expect(tiles.first().getByRole("heading")).toHaveText("Building Customer Trust Online");

  const tabs = page.getByRole("navigation", { name: "Categories" });
  await expect(tabs.getByRole("link", { name: "All" })).toHaveAttribute("aria-current", "page");
  // A tab changes the list under it: the page keeps its scroll.
  await tabs.scrollIntoViewIfNeeded();
  const scrolled = await page.evaluate(() => window.scrollY);
  expect(scrolled).toBeGreaterThan(0);
  await tabs.getByRole("link", { name: "Technology" }).click();
  await expect(page).toHaveURL(/\/blog\?category_url_key=technology$/);
  await expect(tabs.getByRole("link", { name: "Technology" })).toHaveAttribute("aria-current", "page");
  await expect(tiles).toHaveCount(2);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${app_config.SITE_URL}/blog?category_url_key=technology`,
  );

  await tiles.getByRole("link", { name: /AI in E-Commerce/ }).click();
  await expect(page).toHaveURL(/\/blog\/ai-in-e-commerce$/);
});

test("a post links its category and its authors' pages", async ({ page }) => {
  await page.goto(POST);
  await expect(page.locator("article header").getByRole("link", { name: "Technology" })).toHaveAttribute(
    "href",
    /\/blog\?category_url_key=technology$/,
  );
  await page.locator("article header").getByRole("link", { name: "Anna Kowalska" }).click();
  await expect(page).toHaveURL(/\/blog\/authors\/anna-kowalska$/);
  await expect(page.getByRole("heading", { level: 1, name: "Anna Kowalska" })).toBeVisible();
  await expect(page.getByText("Editor in Chief")).toBeVisible();
  await expect(page.getByRole("link", { name: "linkedin.com" })).toHaveAttribute("href", /linkedin\.com/);
  await expect(page.getByRole("heading", { level: 2, name: "Articles by Anna Kowalska" })).toBeVisible();
  await expect(page.locator("[data-blog-posts] > li")).toHaveCount(2);
  expect(await json_ld(page, "ProfilePage")).toMatchObject({
    mainEntity: { "@type": "Person", name: "Anna Kowalska", jobTitle: "Editor in Chief" },
  });
});

test("a page past the last one is not found", async ({ page }) => {
  await page.goto("/blog?page=5");
  await expect(page.locator("[data-blog-posts]")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
});
