// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import tokens from "@entirius/brand-tokens/tokens.json";
import { THEME } from "@/_CONFIG/app.config.json";
import { THEME_COLOR } from "@/lib/brand";
import { get_path } from "@/lib/seo/config";

// Size of the generated share image (app/og-image.png/route.tsx): the 1.91:1 card of Open Graph and X.
export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };

// A brand token by its dot path in brand.json, following `{path}` references (accent.fill → {tertiary.100}).
export function brand_token(path: string): string {
  const value = get_path(tokens, `${path}.$value`);
  if (typeof value !== "string") throw new Error(`Unknown brand token: ${path}`);
  const ref = /^\{(.+)\}$/.exec(value);
  return ref ? brand_token(ref[1]) : value;
}

// The image is drawn outside the CSS, so it reads the same tokens app/globals.css maps for the page
// background and headings of the active THEME. Only the accent band takes BRAND.THEME_COLOR: it carries
// no text, so any configured colour keeps the name readable.
export function share_image_colors(theme: string = THEME) {
  const dark = theme === "dark";
  return {
    background: brand_token(dark ? "black" : "light.neutral.100"),
    foreground: brand_token(dark ? "basic.950" : "light.neutral.900"),
    accent: THEME_COLOR ?? brand_token("accent.fill"),
  };
}
