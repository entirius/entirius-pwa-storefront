// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { API_BASE_URL } from "@/_CONFIG/app.config.json";
import { image_placeholder, resolve_media_uri } from "@/utils/NORMALIZERS/media.normalizer";

const MEDIA_ORIGIN = new URL(API_BASE_URL).origin;

// Backend paths go to the API host; absolute URLs only from it (next/image allows that host alone); anything else,
// or nothing, is the placeholder.
export function media_src(src: string | null | undefined): string {
  if (!src) return image_placeholder;
  if (src.startsWith("/media/")) return resolve_media_uri(src);
  if (src.startsWith("/")) return src;
  try {
    return new URL(src).origin === MEDIA_ORIGIN ? src : image_placeholder;
  } catch {
    return image_placeholder;
  }
}
