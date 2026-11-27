// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import type { CmsDocumentContent } from "@/types/cms.types";
import { own_heading_content, page_title } from "./page-heading";

const content = (description: string): CmsDocumentContent => ({
  sections: { s: { core_type: "section-text" } },
  tiles: { t: { core_type: "tile-txt-btn", title: "Terms", description } },
  sections_order: ["s"],
  tiles_order: { s: ["t"] },
});

describe("page_title", () => {
  it("prefers the public meta title to the document name", () => {
    expect(page_title({ name: "Terms (EN)", meta: { title: "Terms" } })).toBe("Terms");
  });

  it("falls back to the name, then to nothing", () => {
    expect(page_title({ name: "About Us", meta: {} })).toBe("About Us");
    expect(page_title({ name: " ", meta: { title: "" } })).toBeNull();
  });
});

describe("own_heading_content", () => {
  it("drops the tile title when its HTML carries the H1", () => {
    const result = own_heading_content(content("<h1>Terms</h1> <p>Text</p>"));
    expect(result.has_h1).toBe(true);
    expect(result.content.tiles.t.title).toBeUndefined();
    expect(result.content.tiles.t.description).toBe("<h1>Terms</h1> <p>Text</p>");
  });

  it("leaves a document without an H1 in its text untouched", () => {
    const original = content("<h2>Scope</h2><p>Text</p>");
    const result = own_heading_content(original);
    expect(result.has_h1).toBe(false);
    expect(result.content).toBe(original);
  });
});
