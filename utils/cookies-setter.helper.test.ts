// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import countries from "@/_CONFIG/countries.config.json";
import geo_CF_helper, { profile_from_path } from "./cookies-setter.helper";

type Profile = { languages: string[]; default_language: string; currencies: string[]; default_currency: string };
const PROFILES = countries as Record<string, Profile>;
const DEFAULT = PROFILES.default;
// Any profile other than `default` (the example config has one).
const OTHER = Object.keys(PROFILES).find((k) => k !== "default")!;

const request = (path: string, cookie = "", country?: string) =>
  new NextRequest(`http://shop.test${path}`, {
    headers: { cookie, ...(country && { "cf-ipcountry": country }) },
  });

describe("profile_from_path", () => {
  it("reads a configured profile from the first segment, nothing else", () => {
    expect(profile_from_path(`/${OTHER}/catalog/x`)).toBe(OTHER);
    expect(profile_from_path(`/${OTHER}`)).toBe(OTHER);
    expect(profile_from_path("/catalog/x")).toBeNull();
    expect(profile_from_path("/fr/catalog/x")).toBeNull();
  });
});

describe("geo_CF_helper", () => {
  it("takes the profile from the path, never from the ct cookie or the IP", () => {
    expect(geo_CF_helper(request("/catalog/x", `ct=${OTHER}`, OTHER.toUpperCase())).ct).toBe("default");
    expect(geo_CF_helper(request(`/${OTHER}/catalog/x`, "ct=default")).ct).toBe(OTHER);
  });

  it("without cookies uses the defaults of the path's profile (a crawler sees one language per address)", () => {
    const values = geo_CF_helper(request(`/${OTHER}/catalog/x`));
    expect(values.lg).toBe(PROFILES[OTHER].default_language);
    expect(values.cr).toBe(PROFILES[OTHER].default_currency);
  });

  it("keeps a language and currency the profile offers, replaces others", () => {
    const kept = DEFAULT.languages.find((l) => l !== DEFAULT.default_language)!;
    expect(geo_CF_helper(request("/catalog/x", `lg=${kept}`)).lg).toBe(kept);
    expect(geo_CF_helper(request("/catalog/x", "lg=xx; cr=xxx")).lg).toBe(DEFAULT.default_language);
    expect(geo_CF_helper(request("/catalog/x", "cr=xxx")).cr).toBe(DEFAULT.default_currency);
  });

  it("only hands out a channel the shop serves", () => {
    for (const ch of ["no-such-channel", "../../admin"]) {
      const value = geo_CF_helper(request("/catalog/x", `ch=${ch}`)).ch;
      expect(value).not.toBe(ch);
      expect(value).toBeTruthy();
    }
  });

  it("reports the visitor's country profile, lower-cased, and the previous visit", () => {
    const values = geo_CF_helper(request("/", `ct=${OTHER}`, OTHER.toUpperCase()));
    expect(values.geo).toBe(OTHER);
    expect(values.visited).toBe(OTHER);
    expect(geo_CF_helper(request("/", "", "US")).geo).toBeNull();
  });
});
