// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// The public address of a path in a country profile: `/pl/catalog/x`, or `/catalog/x` for `default`, whose
// addresses carry no prefix (proxy.ts rewrites them to `/default/...` and sends `/default/...` back with 301).
// One address per page: links, canonical and the sitemap all use this form.
export const DEFAULT_PROFILE = "default";

export function profile_path(country: string | null | undefined, path: string): string {
  return !country || country === DEFAULT_PROFILE ? path : `/${country}${path}`;
}
