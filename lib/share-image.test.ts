// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { THEME_COLOR } from "@/lib/brand";
import { brand_token, share_image_colors } from "./share-image";

describe("share image colours", () => {
  it("follows a token reference down to its value", () => {
    expect(brand_token("accent.fill")).toBe(brand_token("tertiary.100"));
    expect(brand_token("accent.fill")).not.toMatch(/^\{/);
  });

  it("names the token it cannot find", () => {
    expect(() => brand_token("accent.missing")).toThrow("accent.missing");
  });

  it("takes the background and headings of the theme, the band from BRAND.THEME_COLOR first", () => {
    const light = share_image_colors("light");
    const dark = share_image_colors("dark");
    expect(light).toMatchObject({ background: brand_token("light.neutral.100"), foreground: brand_token("light.neutral.900") });
    expect(dark).toMatchObject({ background: brand_token("black"), foreground: brand_token("basic.950") });
    expect(light.accent).toBe(THEME_COLOR ?? brand_token("accent.fill"));
  });
});
