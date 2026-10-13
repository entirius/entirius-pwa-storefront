// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

export type GalleryMedia = { uri: string; width: number; height: number }[][];

// Smooth scrolling unless the visitor asked for less motion.
export const scroll_behavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

// Index of the slide a horizontal scroll-snap track currently shows.
export const slide_index = (track: HTMLElement): number =>
  track.clientWidth ? Math.round(track.scrollLeft / track.clientWidth) : 0;
