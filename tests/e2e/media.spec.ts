import { expect, test, type Page } from "@playwright/test";

// Product images: backend media paths must reach next/image as absolute URLs
// on the API host, and a file that fails to load falls back to the placeholder
// instead of a broken image.

function track_image_errors(page: Page) {
  const bad: string[] = [];
  page.on("response", (response) => {
    if (!response.url().includes("/_next/image")) return;
    // 400 = next/image refused the URL (unresolved relative path, host not in
    // remotePatterns, local IP blocked). A 404 is a file missing on the backend,
    // which the placeholder covers.
    if (response.status() === 400) bad.push(response.url());
  });
  return bad;
}

async function expect_images_rendered(page: Page) {
  const images = page.locator("main img");
  await expect(images.first()).toBeVisible();
  // Every image ends up decoded: either the real file or the placeholder.
  await expect
    .poll(() =>
      images.evaluateAll((nodes) =>
        nodes.filter(
          (n) =>
            (n as HTMLImageElement).complete &&
            (n as HTMLImageElement).naturalWidth === 0,
        ).length,
      ),
    )
    .toBe(0);
}

test("catalog tiles load product images or the placeholder", async ({ page }) => {
  const bad = track_image_errors(page);
  await page.goto("/catalog/chairs");
  await expect_images_rendered(page);
  expect(bad).toEqual([]);
});

test("product page gallery loads images or the placeholder", async ({ page }) => {
  const bad = track_image_errors(page);
  // The one seeded product with a full media gallery.
  await page.goto("/product/drone-dock-ottoman");
  await expect_images_rendered(page);
  expect(bad).toEqual([]);
});
