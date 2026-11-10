// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import app_config from "@/_CONFIG/app.config.json";
import type { CspSources } from "@/lib/csp";

type RawConfig = {
  DELIVERY_POINTS?: {
    GOOGLE_MAPS_API_KEY?: unknown;
    GOOGLE_MAPS_MAP_ID?: unknown;
    TYPES_BY_METHOD?: unknown;
  };
};

const raw = (app_config as RawConfig).DELIVERY_POINTS ?? {};
const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

function types_by_method(v: unknown): Record<string, string[]> {
  if (!v || typeof v !== "object") return {};
  const out: Record<string, string[]> = {};
  for (const [code, types] of Object.entries(v)) {
    if (Array.isArray(types)) out[code] = types.filter((t): t is string => typeof t === "string");
  }
  return out;
}

// The map of the pickup point picker: a browser key of the Maps JavaScript API (restricted to the shop's domains in
// the Google Cloud console) and a map ID (Advanced Markers need one). Either missing → the picker has no map.
export function google_maps(config: RawConfig["DELIVERY_POINTS"] = raw): { key: string; map_id: string } | null {
  const key = text(config?.GOOGLE_MAPS_API_KEY);
  const map_id = text(config?.GOOGLE_MAPS_MAP_ID);
  return key && map_id ? { key, map_id } : null;
}

export const GOOGLE_MAPS = google_maps();
export const TYPES_BY_METHOD = types_by_method(raw.TYPES_BY_METHOD);

// What the Maps JavaScript API needs under a nonce CSP (developers.google.com/maps/documentation/javascript/
// content-security-policy). proxy.ts adds it only when the map is configured: without a key the policy stays as it
// is. 'unsafe-eval' and blob: are in Google's own sample policy.
export const GOOGLE_MAPS_CSP: CspSources = {
  "script-src": ["'unsafe-eval'", "blob:"],
  "img-src": ["https://*.googleapis.com", "https://*.gstatic.com", "*.google.com", "*.googleusercontent.com"],
  "frame-src": ["*.google.com"],
  "connect-src": ["https://*.googleapis.com", "*.google.com", "https://*.gstatic.com", "data:", "blob:"],
  "font-src": ["https://fonts.gstatic.com"],
  "style-src": ["https://fonts.googleapis.com"],
  "worker-src": ["blob:"],
};
