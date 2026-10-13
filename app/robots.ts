// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/config";

// Private flows and filtered listings (`q_` filters, `s_` sorting, `r_` ranges) stay out of the index;
// everything else is open. The `/*/` forms cover the country profile segment (`/default/cart`).
const PRIVATE = ["cart", "checkout", "profile", "user-handler"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        ...PRIVATE.flatMap((path) => [`/${path}`, `/*/${path}`]),
        "/*?*q_",
        "/*?*s_",
        "/*?*r_",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
