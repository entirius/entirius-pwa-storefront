// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, test, type Page } from "@playwright/test";

// The footer must not be painted under a loading spinner and then pushed down when the page arrives: a cold load
// of a streamed page (category, search results, CMS page) shifts nothing the visitor sees.
const CLS_LIMIT = 0.05;

const cumulative_shift = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
            if (!entry.hadRecentInput) total += entry.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => resolve(total), 2500);
      }),
  );

for (const width of [1280, 390]) {
  for (const path of ["/catalog/chairs", "/search?q=chair", "/privacy"]) {
    test(`${path} does not shift its footer at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      expect(await cumulative_shift(page)).toBeLessThan(CLS_LIMIT);
    });
  }
}
