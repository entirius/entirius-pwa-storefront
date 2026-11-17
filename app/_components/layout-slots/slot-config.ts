// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import appConfig from "@/_CONFIG/app.config.json";

const raw = (appConfig as { LAYOUT_SLOTS?: { ANNOUNCEMENT_COPIES?: unknown } }).LAYOUT_SLOTS;

const MAX_COPIES = 10;

export function clamp_copies(value: unknown): number {
  const requested = Number(value);
  return !Number.isNaN(requested) ? Math.min(Math.max(Math.floor(requested), 1), MAX_COPIES) : 1;
}

// How many times the announcement's content is repeated for a theme's looping ticker. 1 (default): no repeats, no track.
export const ANNOUNCEMENT_COPIES = clamp_copies(raw?.ANNOUNCEMENT_COPIES);
