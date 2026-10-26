// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { SITE_URL, SITE_NAME, SEO } from "@/_CONFIG/app.config.json";
import type { SeoTransform } from "./transforms";

export { SITE_URL, SITE_NAME };

// ------------------------------------------------------------
// Context passed to the builders — non-field, cross-cutting values (route
// segment) used to assemble canonical/OG/JSON-LD URLs.
// ------------------------------------------------------------
export type SEO_CONTEXT = {
  country: string;
  url_key?: string;
  // hreflang → address of the page in the other profiles (lib/seo/alternates.ts).
  languages?: Record<string, string>;
};

// ------------------------------------------------------------
// Field mapping is config-owned. Each entry is a tuple:
//   [outKey, source, transform?]
// where `source` is a dot-path into the RAW api object (numeric indices ok,
// e.g. "brands.0.name") or an array of dot-paths used as a fallback chain,
// and `transform` (optional) names the operation(s) of ./transforms.ts run on
// each candidate: the first non-empty result wins ("", [] and null are empty).
// ------------------------------------------------------------
export type SeoField = [string, string | string[], SeoTransform?];

export const SEO_FIELDS = SEO as unknown as Record<string, SeoField[]>;

// Dot-walk a raw object: get_path(p, "brands.0.name").
export function get_path(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]),
      obj,
    );
}
