// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { isIP } from "node:net";

// The visitor's address for the backend's per-address limits (accounts login throttle, access failed-login guard).
// A call the storefront server makes for the visitor (the login of app/session/login) reaches the API from the
// server's own address, so every visitor would share one counter. The route handler names the visitor in
// `X-Client-IP` instead: django_utils.api.client_ip reads it ("proxied storefront") only from an address listed in
// the backend's CLIENT_IP_TRUSTED_PROXIES.
//
// The address comes from the header the hosting edge sets (`CLIENT_IP_HEADER` of app.config.json, e.g.
// "cf-connecting-ip"). Unset, nothing is sent: any other header could come from the visitor. A list
// (x-forwarded-for) gives its last entry, the address the closest proxy saw.
export const CLIENT_IP_FORWARD_HEADER = "X-Client-IP";

const IPV4_WITH_PORT = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/;

export function client_ip(headers: Headers, source: string | null | undefined): string | null {
  if (!source) return null;
  const entry = headers.get(source)?.split(",").at(-1)?.trim();
  if (!entry) return null;
  const address = entry.replace(IPV4_WITH_PORT, "$1");
  return isIP(address) ? address : null;
}
