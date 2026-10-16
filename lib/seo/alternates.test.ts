// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { afterEach, describe, expect, it, vi } from "vitest";
import { PROFILE_VIEWS, catalog_alternates, hreflang, language_alternates, page_alternates } from "./alternates";

const EN = { profile: "default", language: "en", currency: "eur", channel: "c" };
const PL = { profile: "pl", language: "pl", currency: "pln", channel: "c" };

describe("hreflang", () => {
  it("is the language for the default profile, language-COUNTRY for a country's", () => {
    expect(hreflang(EN)).toBe("en");
    expect(hreflang(PL)).toBe("pl-PL");
  });
});

describe("language_alternates", () => {
  it("lists the profiles that have the page, x-default the default profile's", () => {
    expect(
      language_alternates([
        [EN, "/catalog/chairs"],
        [PL, "/pl/catalog/krzesla"],
      ]),
    ).toEqual({ en: "/catalog/chairs", "pl-PL": "/pl/catalog/krzesla", "x-default": "/catalog/chairs" });
  });

  it("is nothing when only one profile has the page", () => {
    expect(
      language_alternates([
        [EN, "/about"],
        [PL, null],
      ]),
    ).toBeUndefined();
  });
});

describe("page_alternates", () => {
  it("takes the profiles whose language the page is written in", () => {
    const all = page_alternates("/about", PROFILE_VIEWS.map((v) => v.language.toUpperCase()));
    if (PROFILE_VIEWS.length > 1) expect(Object.keys(all!)).toEqual([...PROFILE_VIEWS.map(hreflang), "x-default"]);
    expect(page_alternates("/about", ["xx"])).toBeUndefined();
  });
});

describe("catalog_alternates", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("takes each profile's key in its own language and skips profiles without one", async () => {
    const [first, second] = PROFILE_VIEWS;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        // only the first profile's language has a key
        Response.json({ results: [{ url_key: "x", url_keys: { [first.language]: "chairs" } }] }),
      ),
    );
    expect(await catalog_alternates("catalog", "chairs", first.language)).toBeUndefined();
    if (!second) return;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ results: [{ url_key: "x", url_keys: { [first.language]: "a", [second.language]: "b" } }] }),
      ),
    );
    const found = await catalog_alternates("product", "a", first.language);
    expect(found?.[hreflang(second)]).toBe(`/${second.profile}/product/b`);
  });
});
