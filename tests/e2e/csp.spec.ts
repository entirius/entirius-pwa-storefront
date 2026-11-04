// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";

// The Content-Security-Policy (lib/csp.ts, set by proxy.ts) is enforced: every page carries it with a fresh nonce,
// and the shop's own pages break none of it. A violation shows in the console as "Content Security Policy".

function violations(page: Page) {
  const found: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) found.push(m.text());
  });
  return found;
}

test("every page gets the policy with its own nonce", async ({ page }) => {
  const first = await page.goto("/");
  const second = await page.goto("/");
  const policy = first!.headers()["content-security-policy"];
  expect(policy).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  expect(policy).toContain("object-src 'none'");
  expect(policy).toContain("frame-ancestors 'none'");
  const nonce = (p: string) => p.match(/'nonce-([^']+)'/)?.[1];
  expect(nonce(second!.headers()["content-security-policy"])).not.toBe(nonce(policy));
});

test("the shop's pages run under the policy without a violation", async ({ page }) => {
  const found = violations(page);
  await page.goto("/");
  await page.goto("/catalog/chairs");
  await page.goto("/product/docking-bay-chair");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.locator("header").getByRole("link", { name: /^Cart, 1 item$/ }).click();
  await expect(page.getByRole("region", { name: "Items in your cart" })).toContainText("Docking Bay Chair");
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await page.goto("/blog");
  expect(found).toEqual([]);
});

// Markup an injection would slip into a page (HTML from the API through a broken sanitizer): an inline event handler.
// 'strict-dynamic' trusts scripts the shop's code creates, not handlers in markup.
async function injected_handler_runs(page: Page) {
  await page.goto("/");
  return page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const w = window as unknown as { __injected?: boolean };
        w.__injected = false;
        const box = document.createElement("div");
        box.innerHTML = '<img src="data:," onerror="window.__injected = true">';
        document.body.appendChild(box);
        setTimeout(() => resolve(w.__injected === true), 300);
      }),
  );
}

test("an injected inline handler does not run", async ({ page }) => {
  expect(await injected_handler_runs(page)).toBe(false);
});

test("without the policy the same handler would run (the probe works)", async ({ browser }) => {
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();
  expect(await injected_handler_runs(page)).toBe(true);
  await context.close();
});
