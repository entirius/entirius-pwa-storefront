// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Letters that fit between the header's edge and the centred logo at the narrowest width with one row (1280 px).
const TOP_ROW_MAX_LETTERS = 55;

// Does the desktop menu share the top row with the logo? A short list does, a longer one moves to its own row as a
// whole. The limit on letters keeps three long names from running into the logo. `max_items` 0: never.
export function menu_fits_top_row(names: string[], max_items: number): boolean {
  return max_items > 0 && names.length <= max_items && names.join("").length <= TOP_ROW_MAX_LETTERS;
}
