// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo/config";
import { SHARE_IMAGE_SIZE, share_image_colors } from "@/lib/share-image";

// Default share image at /og-image.png (a dotted path: proxy.ts does not touch it) for an instance without
// BRAND.OG_IMAGE: the shop name on the theme background over an accent band. A route handler rather than
// the `opengraph-image` file convention: every page that sets its own `openGraph` replaces the parent's
// whole, so a file in app/ would never reach them; lib/brand.ts hands this address to them instead.
export const dynamic = "force-static";

export function GET() {
  const { background, foreground, accent } = share_image_colors();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 96px",
          background,
          color: foreground,
          fontSize: 96,
          letterSpacing: "-0.02em",
        }}
      >
        {SITE_NAME}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 24, background: accent }} />
      </div>
    ),
    SHARE_IMAGE_SIZE,
  );
}
