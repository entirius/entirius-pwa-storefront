import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import {
  API_COOKIE_BANNER_ROUTE,
  API_COOKIE_CONSENTS_ROUTE,
} from "@/API/api.routes";
import type { CONSENT_PAYLOAD, COOKIE_BANNER } from "./consent.d";

// Session cache of the banner, or of the fact that the backend has none: client navigations and
// reloads skip the request, and a backend without a banner is asked once per session.
type CACHED = { banner: COOKIE_BANNER | null };

function cache_key() {
  const access = make_client_access();
  return `cc_banner_${access.get("ch")}_${access.get("lg")}`;
}

function read_cache(): CACHED | null {
  try {
    const cached = sessionStorage.getItem(cache_key());
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function write_cache(value: CACHED) {
  try {
    sessionStorage.setItem(cache_key(), JSON.stringify(value));
  } catch {}
}

// null = no banner: the channel has none published (404), the module is absent, or the request failed.
// `fresh` after a 409 also bypasses the HTTP cache (the backend sends max-age=300, which could
// return the stale revision). Channel and language come from the API layer (`ch`, `lg` cookies).
export async function fetch_cookie_banner(
  fresh = false,
): Promise<COOKIE_BANNER | null> {
  const cached = fresh ? null : read_cache();
  if (cached) return cached.banner;

  const api = create_api(make_client_access());
  const [error, banner] = await api.FETCH_METHOD<COOKIE_BANNER>(
    API_COOKIE_BANNER_ROUTE,
    fresh ? { cache: "no-store" } : undefined,
  );
  // Only a definite answer is remembered; a network failure is asked again on the next page load.
  if (!error || error.status === 404) write_cache({ banner: banner ?? null });
  return banner ?? null;
}

// Returns the HTTP status (0 = no response); the caller reacts to 409 (stale revision) only.
// keepalive: the log entry must still arrive when the visitor leaves the page right after the decision.
export async function post_cookie_consent(
  payload: CONSENT_PAYLOAD,
): Promise<number> {
  const api = create_api(make_client_access());
  const [, , meta] = await api.FETCH_METHOD(API_COOKIE_CONSENTS_ROUTE, {
    method: "POST",
    keepalive: true,
    body: JSON.stringify(payload),
  });
  return meta?.status ?? 0;
}
