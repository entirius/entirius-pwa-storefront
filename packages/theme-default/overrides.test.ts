// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type Group = { title: string; items: Record<string, string>; more?: Record<string, string> };

const src = fileURLToPath(new URL("./src", import.meta.url));
const { groups } = JSON.parse(readFileSync(new URL("./overrides.json", import.meta.url), "utf8")) as {
  groups: Group[];
};
const entries = groups.flatMap((group) => Object.entries({ ...group.items, ...group.more }));

// What `pnpm overrides` can name: every component, page part and tokens.css, not lib/ helpers or tests.
const files = (readdirSync(src, { recursive: true }) as string[])
  .filter((path) => /\.(tsx?|css)$/.test(path) && !path.endsWith(".test.ts") && !path.startsWith("lib/"))
  .map((path) => path.replace(/\.tsx?$/, ""))
  .sort();

// A new file in the default theme needs a line in overrides.json, or theme authors see it without a description.
describe("overrides.json", () => {
  it("describes every file of the default theme", () => {
    expect(entries.map(([path]) => path).sort()).toEqual(files);
  });

  it("names each file once", () => {
    const paths = entries.map(([path]) => path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it.each(entries)("%s has a one-line description", (_path, about) => {
    expect(about.length).toBeGreaterThan(0);
    expect(about.length).toBeLessThanOrEqual(60);
  });
});
