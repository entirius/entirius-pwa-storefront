import { expect, test } from "@playwright/test";

// Product parameters from the PIM attributes (include=full), visible ones only;
// a multi-select joins its values into one row. Seeded: zero-g-recliner.

test("product page lists the specifications and the brand", async ({ page }) => {
  await page.goto("/product/zero-g-recliner");
  await expect(page.getByText("Orbital Foundry")).toBeVisible();

  const specs = page.getByRole("region", { name: "Specifications" });
  const row = (name: string) => specs.locator("dt", { hasText: name }).locator("+ dd");
  await expect(row("Series")).toHaveText("Heliox Works");
  await expect(row("Options")).toHaveText("Ceramic Composite, Nano-Chrome");
  await expect(row("Weight (kg)")).toHaveText("35");
  await expect(specs.locator("dt", { hasText: "Options" })).toHaveCount(1);
});
