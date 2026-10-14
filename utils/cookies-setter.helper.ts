// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { NextRequest } from "next/server";

import countries from "@/_CONFIG/countries.config.json";
import channels from "@/_CONFIG/channels.config.json";
import { DEFAULT_PROFILE } from "@/lib/profile-path";

type Profile = {
  languages?: string[];
  default_language?: string;
  currencies?: string[];
  default_currency?: string;
  channels?: string[];
  default_channel?: string;
};

const PROFILES = countries as Record<string, Profile>;
const SERVED_CHANNELS = new Set(Object.keys(channels));

// The country profile a path names (`/pl/catalog/x` → "pl"); a path without one belongs to `default`.
export function profile_from_path(pathname: string): string | null {
  const segment = pathname.match(/^\/([a-z]{2,})(?:\/|$)/i)?.[1]?.toLowerCase();
  return segment && segment in PROFILES ? segment : null;
}

// A cookie value the profile allows, else the profile's default.
function allowed(value: string | undefined, list: string[] | undefined, fallback: string | undefined) {
  return value && (!list || list.includes(value)) ? value : (fallback ?? null);
}

// The channel goes into the API path: only one this shop serves (channels.config.json) and the profile lists.
function channel_for(profile: Profile, cookie: string | undefined): string | null {
  const own = (profile.channels ?? []).filter((c) => SERVED_CHANNELS.has(c));
  if (cookie && own.includes(cookie)) return cookie;
  for (const candidate of [profile.default_channel, ...own, PROFILES[DEFAULT_PROFILE]?.default_channel]) {
    if (candidate && SERVED_CHANNELS.has(candidate)) return candidate;
  }
  return null;
}

// The request's profile and the values the shop runs with, as proxy.ts writes them back as cookies.
//
// The profile always comes from the path, never from the visitor's IP: one address shows one country to
// everybody (crawlers included). Language, currency and channel come from the cookies when the profile
// offers them (a choice made in the switch survives), else from the profile's defaults. `geo` is the
// visitor's country profile by Cloudflare (`cf-ipcountry`, lower-cased), only used to send a first visit
// of `/` to its country.
export default function geo_CF_helper(request: NextRequest) {
  const cookie = (name: string) => request.cookies.get(name)?.value || undefined;
  const ct = profile_from_path(request.nextUrl.pathname) ?? DEFAULT_PROFILE;
  const profile = PROFILES[ct] ?? PROFILES[DEFAULT_PROFILE] ?? {};
  const cf = request.headers.get("cf-ipcountry")?.toLowerCase();

  return {
    ct,
    lg: allowed(cookie("lg"), profile.languages, profile.default_language),
    // The profile's own language: what a visitor without a choice of their own gets.
    profile_language: profile.default_language ?? null,
    cr: allowed(cookie("cr"), profile.currencies, profile.default_currency),
    ch: channel_for(profile, cookie("ch")),
    th: cookie("th") ?? null,
    at: cookie("at") ?? null,
    rt: cookie("rt") ?? null,
    uid: cookie("uid") ?? null,
    cid: cookie("cid") ?? null,
    // The profile of the visitor's previous visit, if any (the cookie this function's `ct` is written to).
    visited: cookie("ct") ?? null,
    geo: cf && cf in PROFILES ? cf : null,
  };
}
