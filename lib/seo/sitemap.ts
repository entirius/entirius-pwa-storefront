// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { MetadataRoute } from "next";
import { profile_path } from "@/lib/profile-path";
import { language_alternates, type ProfileView } from "./alternates";

// Addresses of the sitemap: the form the page declares as canonical (lib/seo/build.ts), `/product/{key}` for
// `default` and `/{profile}/product/{key}` else; CMS pages by their route, home as the profile's root.
export const sitemap_path = (profile: string, kind: "product" | "catalog" | "page", key: string): string =>
  profile_path(profile, kind === "page" ? (key === "home" ? "/" : `/${key}`) : `/${kind}/${key}`);

// One entry per address. `items`: each page as its address in every profile (null = not there); each address
// lists the page's addresses in the other profiles (hreflang), the same set the page itself declares.
export function sitemap_entries(origin: string, items: [ProfileView, string | null][][]): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  const out: MetadataRoute.Sitemap = [];
  for (const paths of items) {
    const languages = language_alternates(paths);
    const absolute = languages && Object.fromEntries(Object.entries(languages).map(([lang, path]) => [lang, origin + path]));
    for (const [, path] of paths) {
      if (!path || seen.has(path)) continue;
      seen.add(path);
      out.push({ url: origin + path, ...(absolute && { alternates: { languages: absolute } }) });
    }
  }
  return out;
}
