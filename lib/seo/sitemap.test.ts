// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import type { ProfileView } from "./alternates";
import { sitemap_entries, sitemap_path } from "./sitemap";

const EN: ProfileView = { profile: "default", language: "en", currency: "eur", channel: "c" };
const PL: ProfileView = { profile: "pl", language: "pl", currency: "pln", channel: "c" };

describe("sitemap_path", () => {
  it("uses the canonical form, `default` without a prefix", () => {
    expect(sitemap_path("default", "product", "a-b")).toBe("/product/a-b");
    expect(sitemap_path("pl", "catalog", "krzesla")).toBe("/pl/catalog/krzesla");
  });

  it("keeps CMS pages by route, home as the profile's root", () => {
    expect(sitemap_path("default", "page", "about")).toBe("/about");
    expect(sitemap_path("default", "page", "home")).toBe("/");
    expect(sitemap_path("pl", "page", "home")).toBe("/pl");
  });
});

describe("sitemap_entries", () => {
  it("lists every address once, each with the page's addresses in the other profiles", () => {
    const entries = sitemap_entries("https://shop.test", [
      [
        [EN, "/catalog/chairs"],
        [PL, "/pl/catalog/krzesla"],
      ],
      [
        [EN, "/about"],
        [PL, null],
      ],
      [
        [EN, "/about"],
        [PL, null],
      ],
    ]);
    const languages = {
      en: "https://shop.test/catalog/chairs",
      "pl-PL": "https://shop.test/pl/catalog/krzesla",
      "x-default": "https://shop.test/catalog/chairs",
    };
    expect(entries).toEqual([
      { url: "https://shop.test/catalog/chairs", alternates: { languages } },
      { url: "https://shop.test/pl/catalog/krzesla", alternates: { languages } },
      { url: "https://shop.test/about" },
    ]);
  });
});
