import { expect, test, type Page } from "@playwright/test";

// Category and product pages carry an H1 and a breadcrumb trail built from the
// API (`breadcrumbs` on the category, `categories[0].path` on the product), plus
// a matching BreadcrumbList in JSON-LD.

async function breadcrumb_ld(page: Page) {
  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  return blocks
    .flatMap((b) => [JSON.parse(b)].flat())
    .find((d: { "@type"?: string }) => d["@type"] === "BreadcrumbList");
}

test("category page has a heading, description and breadcrumbs", async ({ page }) => {
  await page.goto("/catalog/chairs");
  await expect(page.getByRole("heading", { level: 1, name: "Chairs" })).toBeVisible();
  await expect(page.getByText("Comfortable chairs for any room")).toBeVisible();

  const nav = page.getByRole("navigation", { name: "breadcrumb" });
  await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  await expect(nav.locator('[aria-current="page"]')).toHaveText("Chairs");

  const ld = await breadcrumb_ld(page);
  expect(ld.itemListElement.map((i: { name: string }) => i.name)).toEqual(["Chairs"]);
});

test("product page breadcrumbs lead back to its category", async ({ page }) => {
  await page.goto("/product/flight-deck-command-chair");
  const nav = page.getByRole("navigation", { name: "breadcrumb" });
  await expect(nav.locator('[aria-current="page"]')).toHaveText("Flight Deck Command Chair");

  const ld = await breadcrumb_ld(page);
  expect(ld.itemListElement.map((i: { name: string }) => i.name)).toEqual([
    "Chairs",
    "Flight Deck Command Chair",
  ]);

  await nav.getByRole("link", { name: "Chairs" }).click();
  await expect(page).toHaveURL(/\/catalog\/chairs$/);
  await expect(page.getByRole("heading", { level: 1, name: "Chairs" })).toBeVisible();
});
