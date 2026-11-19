// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { menu_fits_top_row } from "./menu-layout";

describe("menu_fits_top_row", () => {
  it("keeps a short list in the top row", () => {
    expect(menu_fits_top_row(["Chairs", "Sofas"], 3)).toBe(true);
    expect(menu_fits_top_row(["Chairs", "Sofas", "Office"], 3)).toBe(true);
  });

  it("moves a longer list to its own row", () => {
    expect(menu_fits_top_row(["Chairs", "Sofas", "Office", "Outdoor"], 3)).toBe(false);
  });

  it("follows the configured limit", () => {
    expect(menu_fits_top_row(["Chairs", "Sofas", "Office", "Outdoor"], 4)).toBe(true);
  });

  it("never shares the row with a limit of 0", () => {
    expect(menu_fits_top_row(["Chairs"], 0)).toBe(false);
    expect(menu_fits_top_row([], 0)).toBe(false);
  });

  it("moves three long names away from the logo", () => {
    const long = ["Command Deck Workspace", "Hydroponics And Decor", "Station Lighting Sets"];
    expect(menu_fits_top_row(long, 3)).toBe(false);
  });
});
