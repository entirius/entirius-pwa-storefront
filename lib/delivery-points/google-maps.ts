// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

/// <reference types="google.maps" />

// Loads the Maps JavaScript API once per page, on demand: only the pickup point map calls it, and only when the
// deployment configured a key (lib/delivery-points/config.ts). The script is inserted by our own code, which the
// CSP's 'strict-dynamic' trusts; the API then loads its libraries itself (`importLibrary`).
const CALLBACK = "__entirius_maps_loaded";

let loading: Promise<typeof google.maps> | null = null;

export function load_google_maps(key: string, language: string): Promise<typeof google.maps> {
  if (typeof google !== "undefined" && typeof google.maps?.importLibrary === "function") return Promise.resolve(google.maps);
  loading ??= new Promise((resolve, reject) => {
    (window as unknown as Record<string, () => void>)[CALLBACK] = () => resolve(google.maps);
    const params = new URLSearchParams({ key, v: "weekly", loading: "async", language, callback: CALLBACK });
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("The Maps JavaScript API did not load"));
    };
    document.head.append(script);
  });
  return loading;
}
