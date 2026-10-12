import type { NextConfig } from "next";
import { API_BASE_URL } from "@/_CONFIG/app.config.json";
import { api_remote_pattern, is_loopback_api } from "./utils/image-host";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: is_loopback_api(API_BASE_URL),
    remotePatterns: [
      api_remote_pattern(API_BASE_URL),
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  // The API returns media paths without a host: serve them from the backend when no reverse proxy does.
  async rewrites() {
    return [{ source: "/media/:path*", destination: `${API_BASE_URL}/media/:path*` }];
  },
  skipTrailingSlashRedirect: true,
  cacheComponents: true,
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
} as NextConfig;

export default nextConfig;
