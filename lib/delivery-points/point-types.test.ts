// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { fits, point_types, type_query } from "./point-types";

describe("point_types", () => {
  it("asks no point for an address method", () => {
    expect(point_types({ code: "europe-standard", method_type: "default" })).toBeNull();
    expect(point_types({ code: "courier", method_type: null })).toBeNull();
  });

  it("takes InPost lockers for inpost and every type for pickup_point", () => {
    expect(point_types({ code: "inpost-locker", method_type: "inpost" })).toEqual(["inpost"]);
    expect(point_types({ code: "pickup-point", method_type: "pickup_point" })).toEqual([]);
  });

  it("lets the deployment name the types per method code", () => {
    const by_method = { "pickup-point": ["showroom", "retail_store"], "europe-standard": ["dpd"] };
    expect(point_types({ code: "pickup-point", method_type: "pickup_point" }, by_method)).toEqual([
      "showroom",
      "retail_store",
    ]);
    // An address method stays one: the override names types, it does not turn a method into a point method.
    expect(point_types({ code: "europe-standard", method_type: "default" }, by_method)).toBeNull();
  });
});

describe("type_query", () => {
  it("sends one type and leaves several to the storefront", () => {
    expect(type_query(["inpost"])).toEqual({ type: "inpost" });
    expect(type_query(["showroom", "retail_store"])).toEqual({});
    expect(type_query([])).toEqual({});
  });
});

describe("fits", () => {
  it("keeps the points of the method's types", () => {
    expect(fits({ type_code: "dpd" }, [])).toBe(true);
    expect(fits({ type_code: "showroom" }, ["showroom", "retail_store"])).toBe(true);
    expect(fits({ type_code: "dpd" }, ["showroom"])).toBe(false);
    expect(fits({ type_code: null }, ["showroom"])).toBe(false);
  });
});
