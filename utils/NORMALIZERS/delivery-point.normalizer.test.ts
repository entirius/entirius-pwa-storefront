// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { NORM_CART_POINT, NORM_DELIVERY_POINTS, point_address, to_cart_point } from "./delivery-point.normalizer";

const RAW = {
  id: 4,
  type_code: "inpost",
  type_name: "InPost",
  is_carrier: true,
  code: "WAW01A",
  name: "Paczkomat WAW01A",
  latitude: 52.2297,
  longitude: 21.0122,
  street: "ul. Marszalkowska 10",
  city: "Warszawa",
  post_code: "00-624",
  country: "",
  opening_hours: "",
  hint: "Przy wejsciu do Biedronki",
  distance: 0.1535,
};

describe("NORM_DELIVERY_POINTS", () => {
  it("reads a page of points", () => {
    const [point] = NORM_DELIVERY_POINTS({ count: 1, next: null, results: [RAW] });
    expect(point).toEqual({
      code: "WAW01A",
      name: "Paczkomat WAW01A",
      type_code: "inpost",
      type_name: "InPost",
      street: "ul. Marszalkowska 10",
      city: "Warszawa",
      post_code: "00-624",
      hint: "Przy wejsciu do Biedronki",
      opening_hours: null,
      lat: 52.2297,
      lng: 21.0122,
      distance_km: 0.1535,
    });
  });

  it("drops a point without a code and takes a bare list", () => {
    expect(NORM_DELIVERY_POINTS([RAW, { name: "No code" }])).toHaveLength(1);
    expect(NORM_DELIVERY_POINTS(null)).toEqual([]);
    expect(NORM_DELIVERY_POINTS({ results: "nope" })).toEqual([]);
  });

  it("has no distance outside nearby/", () => {
    expect(NORM_DELIVERY_POINTS([{ ...RAW, distance: null }])[0].distance_km).toBeNull();
  });
});

describe("cart point", () => {
  it("sends the point the way the cart keeps it", () => {
    const [point] = NORM_DELIVERY_POINTS([RAW]);
    const sent = to_cart_point(point);
    expect(sent).toEqual({
      code: "WAW01A",
      name: "Paczkomat WAW01A",
      address: "ul. Marszalkowska 10",
      city: "Warszawa",
      postcode: "00-624",
    });
    expect(NORM_CART_POINT(sent)).toEqual(sent);
    expect(NORM_CART_POINT({ name: "x" })).toBeNull();
    expect(point_address(sent)).toBe("ul. Marszalkowska 10, 00-624 Warszawa");
    expect(point_address(point)).toBe("ul. Marszalkowska 10, 00-624 Warszawa");
  });
});
