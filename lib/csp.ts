// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// The Content-Security-Policy of every page, built per request by proxy.ts (node_modules/next/dist/docs/01-app/
// 02-guides/content-security-policy.md). Scripts run only with the request's nonce, which Next.js puts on its own
// scripts; 'strict-dynamic' lets them load their chunks. Styles keep 'unsafe-inline': Radix and the `style`
// attributes of the components need it, and a nonce in style-src would make browsers ignore it. The browser talks
// to the API itself (cart, account, agreements), so its origin is allowed for data and media. A deployment adds its
// own sources (analytics, a payment widget, a CDN) per directive in `CSP` of _CONFIG/app.config.json.

export type CspSources = Partial<Record<string, string[]>>;

const origin = (url: string): string | null => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

export function build_csp({
  nonce,
  dev,
  api_base_url,
  site_url,
  extra = {},
}: {
  nonce: string;
  dev: boolean;
  api_base_url: string;
  site_url: string;
  extra?: CspSources;
}): string {
  const api = origin(api_base_url);
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // React's dev build needs eval to rebuild server error stacks; production does not.
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", ...(api ? [api] : [])],
    "media-src": ["'self'", ...(api ? [api] : [])],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...(api ? [api] : [])],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  for (const [name, sources] of Object.entries(extra)) {
    if (!sources?.length) continue;
    directives[name] = [...new Set([...(directives[name] ?? ["'self'"]), ...sources])];
  }
  const policy = Object.entries(directives).map(([name, sources]) => `${name} ${sources.join(" ")}`);
  // Only for a shop served over https: a local stack talks to an http API.
  if (!dev && site_url.startsWith("https://")) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

// A fresh nonce per request (base64 of a random UUID, as the Next.js guide does).
export function make_nonce(): string {
  return btoa(crypto.randomUUID());
}
