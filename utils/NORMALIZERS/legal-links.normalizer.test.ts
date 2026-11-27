// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { NORM_LEGAL_LINKS } from "./legal-links.normalizer";

describe("NORM_LEGAL_LINKS", () => {
  it("links each page by its public title, never the editors' name", () => {
    const response = {
      data: [
        { name: "Regulamin (PL)", routes: ["terms"], meta: { title: "Regulamin" } },
        { name: "Polityka (PL)", routes: ["/privacy"], meta: { title: " Polityka prywatności " } },
      ],
    };
    expect(NORM_LEGAL_LINKS(response)).toEqual([
      { label: "Regulamin", href: "/terms", external: false },
      { label: "Polityka prywatności", href: "/privacy", external: false },
    ]);
  });

  it("leaves out a page without a route or a public title", () => {
    const response = {
      data: [
        { name: "No route", routes: [], meta: { title: "A" } },
        { name: "No title", routes: ["x"], meta: {} },
        { name: "No meta", routes: ["y"] },
        null,
      ],
    };
    expect(NORM_LEGAL_LINKS(response)).toEqual([]);
  });

  it("gives no links for an answer that is not a list", () => {
    expect(NORM_LEGAL_LINKS(null)).toEqual([]);
    expect(NORM_LEGAL_LINKS({ data: "x" })).toEqual([]);
  });
});
