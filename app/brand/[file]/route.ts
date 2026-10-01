// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { BRAND } from "@/_CONFIG/app.config.json";

// Serves the instance's identity assets (logo, favicon) from `_CONFIG/brand/`.
// They are per-deployment data like the rest of `_CONFIG/`, so they stay out of
// `public/` and out of git. Only the file names listed in `BRAND` are served —
// the URL never reaches the filesystem as a path.
const BRAND_DIR = path.join(process.cwd(), "_CONFIG", "brand");

const CONTENT_TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

const brand_files = (): string[] =>
  [BRAND.LOGO as string | null, BRAND.FAVICON as string | null].filter(
    (name): name is string => typeof name === "string" && name.length > 0,
  );

export async function GET(_request: Request, ctx: RouteContext<"/brand/[file]">) {
  const { file } = await ctx.params;
  const type = CONTENT_TYPES[path.extname(file).toLowerCase()];
  if (!type || !brand_files().includes(file)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const body = await readFile(path.join(BRAND_DIR, file));
    return new Response(body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=3600",
        // SVG from config is trusted, but never let it run as a document.
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
