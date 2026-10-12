// Pure on purpose: `next.config.ts` loads this file, and the `@/` alias does not
// resolve in modules the config pulls in.
const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

// The `images.remotePatterns` entry of the API host. Next matches `hostname`
// without the port, so the port is its own key — and only when the URL has one.
export function api_remote_pattern(api_base_url: string) {
  const { protocol, hostname, port } = new URL(api_base_url);
  return {
    protocol: protocol.replace(/:$/, "") as "http" | "https",
    hostname,
    ...(port && { port }),
  };
}

// The image optimizer refuses upstreams that resolve to a private address; an
// API on the developer's own machine is the one case where that is expected.
export function is_loopback_api(api_base_url: string): boolean {
  return LOOPBACK_HOSTS.includes(new URL(api_base_url).hostname);
}
