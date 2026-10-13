// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { NextRequest } from "next/server";
import geo_CF_helper from "@/utils/cookies-setter.helper";
import { NextResponse } from "next/server";
// ------------------------------ ---- - ----- -- - - - --

import countries from "@/_CONFIG/countries.config.json";
import channels from "@/_CONFIG/channels.config.json";
import { route_exists } from "@/utils/route-exists";

const REGISTERED_COUNTRIES = Object.keys(countries);
function get_country_from_path(pathname: string): string | null {
  const match = pathname.match(/^\/([a-z]{2,})\/?/i);
  const segment = match?.[1]?.toLowerCase() ?? null;
  if (segment && REGISTERED_COUNTRIES.includes(segment)) return segment;
  return null;
}

// Loop guard for the self request of `render_not_found`.
const NOT_FOUND_RENDER_HEADER = "x-not-found-render";

// The `status` of `NextResponse.rewrite` is ignored by `next start` and the page streams its body with 200,
// so the 404 has to come from here: render the not-found page with an internal request and answer with its
// body and status 404. Null (dev server, which answers 404 itself, or the request failed) = fall back to the
// plain rewrite.
async function render_not_found(request: NextRequest, path: string): Promise<NextResponse | null> {
  if (process.env.NODE_ENV !== "production") return null;
  try {
    // Never derived from the request: behind a reverse proxy the forwarded host/proto name the public
    // https address, which the loopback listener does not speak.
    const origin = process.env.INTERNAL_ORIGIN ?? `http://localhost:${process.env.PORT ?? 3000}`;
    const headers = new Headers({ [NOT_FOUND_RENDER_HEADER]: "1" });
    for (const name of ["cookie", "accept-language", "cf-ipcountry", "user-agent"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const res = await fetch(new URL(path, origin), { headers, redirect: "manual", signal: AbortSignal.timeout(5_000) });
    const out = new Headers({ "content-type": res.headers.get("content-type") ?? "text/html; charset=utf-8" });
    out.set("cache-control", "no-store");
    return new NextResponse(res.body, { status: 404, headers: out });
  } catch {
    return null;
  }
}

export default async function proxy(request: NextRequest) {
  const { ct, lg, cr, th, ch, cid } = geo_CF_helper(request);

  const pathname = request.nextUrl.pathname;
  const country_from_path = get_country_from_path(pathname);

  const finish = (res: NextResponse) => {
    if (ct) res.cookies.set("ct", ct);
    if (lg) res.cookies.set("lg", lg);
    if (cr) res.cookies.set("cr", cr);
    if (th) res.cookies.set("th", th);
    if (ch) {
      res.cookies.set("ch", ch);
      // ch_key = the channel's checkout API key (x-api-key for the cart/checkout
      // API). Non-HttpOnly on purpose: client components read it via document.cookie
      // to build requests. It is a guest-checkout key, already client-visible by design.
      const key = (channels as Record<string, { API_CHECKOUT_KEY?: string }>)[ch]
        ?.API_CHECKOUT_KEY;
      if (key) res.cookies.set("ch_key", key);
    }
    // at/rt/uid are owned solely by the auth Server Actions (set as HttpOnly on
    // login, cleared on logout). Re-emitting them here would strip HttpOnly.
    if (cid) res.cookies.set("cid", cid);
    return res;
  };

  // Unknown product, category or CMS page: the page cannot set the status, so a missing address is
  // rewritten to a CMS route that does not exist (the not-found page), with 404.
  const is_document = !request.headers.get("rsc");
  if (is_document && ch && !request.headers.has(NOT_FOUND_RENDER_HEADER)) {
    const rest = pathname.split("/").filter(Boolean).slice(country_from_path ? 1 : 0);
    if (!(await route_exists(rest, ch))) {
      const url = request.nextUrl.clone();
      // `ct` can be a bare Cloudflare country code (e.g. "PL") that is no profile of countries.config: the
      // not-found page must render under a real profile, or its links get a prefix that does not exist.
      const profile = country_from_path ?? (ct && ct in countries ? ct : "default");
      url.pathname = `/${profile}/not-found-route`;
      const rendered = await render_not_found(request, url.pathname);
      return finish(rendered ?? NextResponse.rewrite(url, { status: 404 }));
    }
  }

  // Already on the correct path — pass through
  if (pathname.startsWith(`/${ct}/`) || pathname === `/${ct}`) {
    return finish(NextResponse.next());
  }

  //- ---------------------------------------------------------
  // INACTIVE/STRIPPED CODE due to rerender problems
  // posible change it to mark in cookies that user is guest
  // ---------------------------------------------------------
  // Visitor enters a country path other than their own ct
  // e.g. ct=default browsing /uk/ — pass through, but flag as guest
  if (country_from_path && country_from_path !== ct) {
    // this allows to access to /uk/ even if ct=default
    // if (request.nextUrl.searchParams.get("seeker") === "true") {
    return finish(NextResponse.next());
    //  }
    // const url = request.nextUrl.clone();
    // url.searchParams.set("seeker", "true");
    // return finish(NextResponse.rewrite(url));
  }
  //- ---------------------------------------------------------
  // ct=default, no country in the path — rewrite to /default/
  if (ct === "default") {
    const url = request.nextUrl.clone();
    url.pathname = `/default${pathname}`;
    return finish(NextResponse.rewrite(url));
  }

  //- ---------------------------------------------------------
  // for now allow to access to /uk/products even if ct=default
  // ---------------------------------------------------------
  // Rewrite to the country path (e.g. /uk/ -> /uk/products)
  const path = country_from_path === null ? `/default${pathname}` : `/${ct}${pathname}`;
  const url = request.nextUrl.clone();
  url.pathname = path;
  return finish(NextResponse.rewrite(url));
}

// ------------------------------ ---- - ----- -- - - - --
export const config = {
  matcher: [
    // Prefetch requests are rewritten too: without the country segment the router would cache the tree of
    // another route (/catalog/x read as country "catalog"), and the page it then shows never loads.
    // `_next` is excluded whole, not per-subpath: it is Next's own namespace and includes the dev HMR
    // endpoint (`_next/webpack-hmr` / `_next/turbopack-hmr`), which carries no file extension and so slipped
    // past the `.*\..*` guard. Geo-rewriting it breaks the HMR connection and the dev client falls back to
    // reloading the page in a loop.
    "/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
