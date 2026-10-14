// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { SITE_NAME } from "@/lib/seo/config";
import {
  BACKGROUND_COLOR,
  MANIFEST_ICONS,
  SHORT_NAME,
  THEME_COLOR,
  brand_url,
  has_manifest,
  icon_type,
} from "@/lib/brand";

// Web app manifest at /manifest.webmanifest (a dotted path: proxy.ts does not touch it). It exists only
// when the instance configured app icons in `BRAND`; app/layout.tsx links it under the same condition.
export function GET() {
  if (!has_manifest()) return new Response("Not found", { status: 404 });
  const manifest = {
    name: SITE_NAME,
    short_name: SHORT_NAME ?? SITE_NAME,
    start_url: "/",
    display: "standalone",
    ...(BACKGROUND_COLOR && { background_color: BACKGROUND_COLOR }),
    ...(THEME_COLOR && { theme_color: THEME_COLOR }),
    icons: MANIFEST_ICONS.flatMap(({ key, ...rest }) => {
      const src = brand_url(key);
      return src ? [{ src, type: icon_type(src), ...rest }] : [];
    }),
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" },
  });
}
