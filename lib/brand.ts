// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { BRAND } from "@/_CONFIG/app.config.json";

// Optional identity settings of `BRAND`: a key that is absent (or null) means "not set" and nothing is
// emitted for it. The files live in `_CONFIG/brand/` and are served by `app/brand/[file]/route.ts`.
const settings = BRAND as Partial<Record<string, string | null>>;

export const BRAND_FILE_KEYS = ["LOGO", "FAVICON", "ICON_192", "ICON_512", "ICON_MASKABLE", "OG_IMAGE"] as const;
type BrandFileKey = (typeof BRAND_FILE_KEYS)[number];

const value = (key: string): string | undefined => settings[key] || undefined;

// File names that the brand route may serve.
export const brand_files = (): string[] =>
  BRAND_FILE_KEYS.flatMap((key) => value(key) ?? []);

export const brand_url = (key: BrandFileKey): string | undefined => {
  const file = value(key);
  return file ? `/brand/${file}` : undefined;
};

// Default Open Graph / Twitter image of pages that have none of their own: the configured file, else
// the image generated from the shop name (app/og-image.png/route.tsx).
export const GENERATED_OG_IMAGE = "/og-image.png";
export const DEFAULT_OG_IMAGES: string[] = [brand_url("OG_IMAGE") ?? GENERATED_OG_IMAGE];

export const THEME_COLOR = value("THEME_COLOR");
export const BACKGROUND_COLOR = value("BACKGROUND_COLOR");
export const SHORT_NAME = value("SHORT_NAME");

// Web app manifest (app/manifest.webmanifest/route.ts): served only when an app icon is configured.
export const MANIFEST_PATH = "/manifest.webmanifest";

export const MANIFEST_ICONS = [
  { key: "ICON_192", sizes: "192x192" },
  { key: "ICON_512", sizes: "512x512" },
  { key: "ICON_MASKABLE", sizes: "512x512", purpose: "maskable" },
] as const;

export const has_manifest = () => MANIFEST_ICONS.some(({ key }) => brand_url(key));

const ICON_TYPES: Record<string, string> = { png: "image/png", webp: "image/webp", svg: "image/svg+xml" };
export const icon_type = (url: string) => ICON_TYPES[url.split(".").pop()?.toLowerCase() ?? ""] ?? "image/png";
