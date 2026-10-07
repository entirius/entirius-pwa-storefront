// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { NextConfig } from "next";
import { API_BASE_URL } from "@/_CONFIG/app.config.json";

// Backend media (`/media/...`, CMS uploads) is served from the API host — see
// resolve_media_uri() in utils/NORMALIZERS/media.normalizer.ts.
const media_host = new URL(API_BASE_URL);

// Next 16 refuses to optimize images from local IPs (SSRF guard). A backend on
// localhost is a dev stack; remotePatterns still pins it to that one host:port.
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: media_host.protocol.replace(":", "") as "http" | "https",
        hostname: media_host.hostname,
        port: media_host.port,
      },
    ],
    dangerouslyAllowLocalIP: LOCAL_HOSTS.includes(media_host.hostname),
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
