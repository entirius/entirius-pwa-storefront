"use client";

import { useEffect } from "react";
import { fetch_cookie_banner } from "./consent-api";

// Asks the backend for the cookie banner after hydration, so the request never blocks render.
// The library and its CSS load only when a banner came back; without one this renders and loads nothing.
export function CookieConsent() {
  useEffect(() => {
    fetch_cookie_banner().then((banner) => {
      if (!banner) return;
      import("./consent-banner").then(({ start_cookie_consent }) =>
        start_cookie_consent(banner),
      );
    });
  }, []);

  return null;
}
