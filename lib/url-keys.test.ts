// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { link_keys, link_target } from "./url-keys";

describe("link_target", () => {
  it("reads the explicit types", () => {
    expect(link_target("catalog", "sofas")).toEqual({ kind: "catalog", key: "sofas" });
    expect(link_target("product", "chair")).toEqual({ kind: "product", key: "chair" });
  });

  it("reads the internal /p/ and /c/ convention", () => {
    expect(link_target("internal", "/p/chair")).toEqual({ kind: "product", key: "chair" });
    expect(link_target("internal", "c/sofas")).toEqual({ kind: "catalog", key: "sofas" });
  });

  it("ignores everything else", () => {
    expect(link_target("internal", "/about-us")).toBeNull();
    expect(link_target("internal", "/c/")).toBeNull();
    expect(link_target("cms", "sofas")).toBeNull();
    expect(link_target("catalog", "")).toBeNull();
  });
});

describe("link_keys", () => {
  it("collects each target of a document once", () => {
    const doc = { sections: [{ buttons: [{ type: "catalog", url: "sofas" }, { type: "internal", url: "/c/sofas" }] }, { type: "product", url: "x" }, { type: "cms", url: "y" }] };
    expect(link_keys(doc)).toEqual([
      { kind: "catalog", key: "sofas" },
      { kind: "product", key: "x" },
    ]);
  });
});
