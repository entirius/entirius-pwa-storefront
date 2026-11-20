// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsWidth } from "@entirius/storefront-sdk/cms";

// Breaks out of the page container (`main` is centred, with padding): a full-width section is as wide as the
// viewport (equal negative margins on both sides, so it also holds in a flex row).
export const FULL_BLEED_CLASS = "w-screen mx-[calc(50%-50vw)]";

export const is_full_width = (width?: CmsWidth) => width === "full_width";

// The grid of a section's tiles: one column, two from two tiles, three from three.
export const grid_for = (count: number) =>
  count >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : count === 2 ? "md:grid-cols-2" : "";
