// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { MetadataRoute } from "next";
import countries from "@/_CONFIG/countries.config.json";
import { SITE_URL } from "@/lib/seo/config";

// Private flows and filtered listings (`q_` filters, `s_` sorting, `r_` ranges) stay out of the index;
// everything else is open. Rules are prefixes and `*` crosses slashes, so `/*/cart` would also close
// `/default/product/cartoon-mug`: each private path is listed under every country profile and closed off
// as the whole address (`$`), its subpages (`/`) or its query (`?`).
const PRIVATE = ["cart", "checkout", "profile", "user-handler", "reset-password"];
const PREFIXES = ["", ...Object.keys(countries).map((profile) => `/${profile}`)];
const QUERY_PARAMS = ["q_", "s_", "r_"];

export function disallowed(): string[] {
  return [
    ...PRIVATE.flatMap((path) => PREFIXES.flatMap((prefix) => ["$", "/", "?"].map((end) => `${prefix}/${path}${end}`))),
    ...QUERY_PARAMS.flatMap((param) => [`/*?${param}`, `/*&${param}`]),
  ];
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: disallowed() },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
