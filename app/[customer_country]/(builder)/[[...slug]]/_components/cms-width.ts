// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// The CMS section option `width`: `container` (default, also for a missing or unknown
// value) or `full_width`. A full-width section spans the viewport instead of the page
// container; `render_cms_document` hands the section's value to its tiles as `section_width`.
export type CmsSectionWidth = "container" | "full_width";

export const is_full_width = (width?: string): boolean => width === "full_width";

// Breaks out of the page container (`main` is centred, with padding): the section is as
// wide as the viewport (equal negative margins on both sides, so it also holds in a flex row).
export const FULL_BLEED_CLASS = "w-screen mx-[calc(50%-50vw)]";

// `sizes` of a desktop hero image: the tile is a half-width card in the container, the whole viewport when full width.
export const hero_desktop_sizes = (width?: string): string =>
  is_full_width(width) ? "100vw" : "50vw";
