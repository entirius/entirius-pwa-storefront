// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { MetadataRoute } from "next";
import { profile_path } from "@/lib/profile-path";

// Addresses of the sitemap. Products and categories use the form the page declares as canonical
// (`/product/{key}` for `default`, `/{profile}/product/{key}` else, see lib/seo/build.ts); CMS pages have no
// canonical and keep the plain path.
export const sitemap_url = (
  origin: string,
  profile: string,
  kind: "product" | "catalog" | "page",
  key: string,
): string => {
  if (kind === "page") return key === "home" ? `${origin}/` : `${origin}/${key}`;
  return `${origin}${profile_path(profile, `/${kind}/${key}`)}`;
};

export function unique_entries(urls: string[]): MetadataRoute.Sitemap {
  return [...new Set(urls)].map((url) => ({ url }));
}
