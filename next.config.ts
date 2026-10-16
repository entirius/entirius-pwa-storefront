// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { NextConfig } from "next";
import { API_BASE_URL } from "@/_CONFIG/app.config.json";
import { api_remote_pattern, is_loopback_api } from "./utils/image-host";

// Backend media (`/media/...`, CMS uploads) is served from the API host — see
// resolve_media_url() in utils/media-url.ts.
const nextConfig: NextConfig = {
  images: {
    // Next 16 refuses to optimize images from local IPs (SSRF guard). A backend on
    // localhost is a dev stack; remotePatterns still pins it to that one host:port.
    dangerouslyAllowLocalIP: is_loopback_api(API_BASE_URL),
    remotePatterns: [api_remote_pattern(API_BASE_URL)],
  },
  // Media paths left in CMS HTML (no host): serve them from the backend when no reverse proxy does.
  async rewrites() {
    return [{ source: "/media/:path*", destination: `${API_BASE_URL}/media/:path*` }];
  },
  skipTrailingSlashRedirect: true,
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

export default nextConfig;
