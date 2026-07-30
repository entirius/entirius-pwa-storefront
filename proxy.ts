import type { NextRequest } from "next/server";
import geo_CF_helper from "@/utils/cookies-setter.helper";
import { NextResponse } from "next/server";
// ------------------------------ ---- - ----- -- - - - --

import countries from "@/_CONFIG/countries.config.json";
import channels from "@/_CONFIG/channels.config.json";

const REGISTERED_COUNTRIES = Object.keys(countries);
function get_country_from_path(pathname: string): string | null {
  const match = pathname.match(/^\/([a-z]{2,})\/?/i);
  const segment = match?.[1]?.toLowerCase() ?? null;
  if (segment && REGISTERED_COUNTRIES.includes(segment)) return segment;
  return null;
}

export default function proxy(request: NextRequest) {
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
    {
      source:
        "/((?!api|_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
