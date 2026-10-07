// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test } from "@playwright/test";

// CMS pages from the seeded ContentDB documents: every core_type the editor
// produces renders (no "Unknown CMS component" placeholder under DEBUG_MODE),
// and CMS links follow the editor's convention (/p/<key> → product page).

const PAGES = [
  { path: "/", heading: "Home", text: "Seats built for long shifts" },
  { path: "/about", heading: "About Us", text: "Our Mission" },
  { path: "/contact", heading: "Contact", text: "Contact Us" },
  { path: "/product-showcase", heading: "Product Showcase", text: "More Picks" },
  { path: "/blog", heading: "Blog Landing Page", text: "Entirius Blog" },
];

for (const { path, heading, text } of PAGES) {
  test(`CMS page ${path} renders its sections`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeAttached();
    await expect(page.getByText(text).first()).toBeVisible();
    await expect(page.getByText("Unknown CMS component")).toHaveCount(0);
  });
}

test("accordion tiles expand on the contact page", async ({ page }) => {
  await page.goto("/contact");
  const question = page.getByRole("button", { name: "How can I reach support?" });
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText(/Email us at/)).toBeVisible();
});

test("a CMS product link opens the product page", async ({ page }) => {
  await page.goto("/product-showcase");
  await page.getByRole("link", { name: "View Product" }).click();
  await expect(page).toHaveURL(/\/product\/orion-command-sofa$/);
  await expect(page.getByRole("heading", { level: 1, name: "Orion Command Sofa" })).toBeVisible();
});

test("home page sections: benefits, products, banner, image with text, FAQ", async ({ page }) => {
  await page.goto("/");
  const section = (name: string) =>
    page.locator("section").filter({ has: page.getByRole("heading", { level: 2, name }) });

  await expect(section("Why shop with us").getByRole("heading", { level: 3 })).toHaveCount(3);

  // Category slider (chairs) and hand-picked SKUs (sale) both list product cards.
  const chairs = section("Chairs");
  await expect(chairs.locator('a[href^="/product/"]').first()).toBeVisible();
  await expect(chairs.getByRole("link", { name: "All chairs" })).toHaveAttribute("href", /\/catalog\/chairs$/);
  const sale = section("On sale");
  await expect(sale.locator('a[href^="/product/"]')).toHaveCount(4);
  await expect(sale.getByText("Escape Pod Ottoman")).toBeVisible();

  await expect(section("Commander's Comfort Bundle").getByRole("link", { name: "See the bundle" })).toHaveAttribute(
    "href",
    /\/product\/commanders-comfort-bundle$/,
  );
  await expect(page.getByRole("heading", { level: 2, name: "Furniture for life in orbit" })).toBeVisible();

  const faq = section("Frequently asked questions");
  const question = faq.getByRole("button", { name: "Can I return a product?" });
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(faq.getByText(/within 30 days of delivery/)).toBeVisible();
});

test("footer link columns come from the CMS", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("navigation", { name: "Footer" });
  await expect(footer.getByRole("heading", { level: 2 })).toHaveText(["Shop", "Help", "Company"]);
  await footer.getByRole("link", { name: "About us" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { level: 1, name: "About Us" })).toBeAttached();
});
