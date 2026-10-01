import { expect, test } from "@playwright/test";

// Every header control has an accessible name, and the cart/wishlist names
// carry the item count — screen readers otherwise announce a bare "button".

test("every header button and link has an accessible name", async ({ page }) => {
  await page.goto("/catalog/chairs");
  const header = page.locator("header");
  const controls = header.locator("button, a");
  await expect(controls.first()).toBeVisible();

  const unnamed = await controls.evaluateAll((nodes) =>
    nodes
      .filter((n) => (n as HTMLElement).offsetParent !== null) // visible only
      .filter((n) => {
        const label = n.getAttribute("aria-label")?.trim();
        const text = (n as HTMLElement).innerText.trim();
        const img_alt = n.querySelector("img[alt]")?.getAttribute("alt")?.trim();
        return !label && !text && !img_alt;
      })
      .map((n) => n.outerHTML.slice(0, 120)),
  );
  expect(unnamed).toEqual([]);

  for (const name of ["Search", "Wishlist", "Cart"]) {
    await expect(header.getByRole("button", { name, exact: true })).toBeVisible();
  }
});

test("cart button name carries the item count", async ({ page }) => {
  await page.goto("/product/flight-deck-command-chair");
  await page.getByRole("button", { name: "Add to cart" }).click();

  const cart = page.locator("header").getByRole("button", { name: /^Cart, 1 item$/ });
  await expect(cart).toBeVisible();
  await cart.click();
  await expect(page.getByRole("dialog")).toContainText("Flight Deck Command Chair");
});
