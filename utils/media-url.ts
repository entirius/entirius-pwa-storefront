// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { API_BASE_URL } from "@/_CONFIG/app.config.json";

// Anything that already names its origin: http(s), protocol-relative, data and blob.
const ABSOLUTE = /^(https?:)?\/\/|^(data|blob):/i;

// A picture source from the API is an absolute URL, used as written, or a path
// served by the API host, the one `images.remotePatterns` allows. API data is
// untyped, so anything that is not a string counts as no source.
export function resolve_media_url(
  source: string | null | undefined,
  api_base_url: string = API_BASE_URL,
): string {
  const value = typeof source === "string" ? source.trim() : "";
  if (!value || ABSOLUTE.test(value)) return value;
  return `${api_base_url.replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
}
