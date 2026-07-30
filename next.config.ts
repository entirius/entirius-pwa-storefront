import type { NextConfig } from "next";
import { API_BASE_URL } from "@/_CONFIG/app.config.json";

function split_url(url: string) {
  const [protocol, hostname] = url.split("://");
  return { protocol, hostname };
}

const { protocol, hostname } = split_url(API_BASE_URL);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: protocol,
        hostname: hostname,
      } as URL,
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
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
