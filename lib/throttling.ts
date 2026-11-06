// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Translate } from "@/lib/i18n/translate";

// The accounts limits (login, signup, password reset mail) answer 429 with `Retry-After` in seconds. Only a call of
// the storefront server can read it: the API sends no Access-Control-Expose-Headers, so a browser call sees the
// status alone and the message names no time.
export function retry_after_seconds(value: string | null | undefined): number | null {
  if (!value) return null;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null;
}

export function throttled_message(t: Translate, retry_after: number | null | undefined): string {
  if (!retry_after) return t("auth.throttled");
  return t("auth.throttled_minutes", { count: Math.max(1, Math.ceil(retry_after / 60)) });
}
