// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { SITE_URL, SITE_NAME, SEO } from "@/_CONFIG/app.config.json";

export { SITE_URL, SITE_NAME };

// ------------------------------------------------------------
// Context passed to the builders — non-field, cross-cutting values (route
// segment) used to assemble canonical/OG/JSON-LD URLs.
// ------------------------------------------------------------
export type SEO_CONTEXT = {
  country: string;
  url_key?: string;
};

// ------------------------------------------------------------
// Field mapping is config-owned. Each entry is a tuple:
//   [outKey, source]
// where `source` is a dot-path into the RAW api object (numeric indices ok,
// e.g. "brands.0.name") or an array of dot-paths used as a fallback chain
// (first non-empty wins). No transforms — props that need an operation
// (strip HTML, walk media[], bool→enum) are intentionally omitted for now;
// see __FEATURES_IMPLEMENTATIONS/SEO.md.
// ------------------------------------------------------------
export type SeoField = [string, string | string[]];

export const SEO_FIELDS = SEO as unknown as Record<string, SeoField[]>;

// Dot-walk a raw object: get_path(p, "brands.0.name").
export function get_path(obj: any, path: string): any {
  return path
    .split(".")
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}
