// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import {
  address_format_issues,
  is_valid_phone,
  is_valid_postcode,
  postcode_example,
} from "./address-rules";

describe("is_valid_postcode", () => {
  it.each([
    ["PL", "00-001"],
    ["DE", "10115"],
    ["FR", "75001"],
    ["GR", "105 57"],
    ["GR", "10557"],
    ["NL", "1012ab"],
    ["GB", "sw1a 1aa"],
    ["PT", "1000-001"],
    ["PL", "  00-001 "],
  ])("accepts %s %s", (country, code) => {
    expect(is_valid_postcode(country, code)).toBe(true);
  });

  it.each([
    ["PL", "00001"],
    ["PL", "0-0001"],
    ["DE", "1011"],
    ["FR", "750011"],
    ["NL", "1012"],
    ["GB", "12345"],
  ])("rejects %s %s", (country, code) => {
    expect(is_valid_postcode(country, code)).toBe(false);
  });

  it("leaves an unknown country and an empty code to other rules", () => {
    expect(is_valid_postcode("ZZ", "anything")).toBe(true);
    expect(is_valid_postcode("PL", "")).toBe(true);
  });

  it("gives an example for the hint", () => {
    expect(postcode_example("pl")).toBe("00-001");
    expect(postcode_example("ZZ")).toBeNull();
  });
});

describe("is_valid_phone", () => {
  it.each([
    ["+48", "600100200"],
    ["+48", "600 100 200"],
    ["+49", "30 901820"],
    ["+33", "6 12 34 56 78"],
    ["+30", "6912345678"],
  ])("accepts %s %s", (code, number) => {
    expect(is_valid_phone(code, number)).toBe(true);
  });

  // Length only (min metadata): Poland also has 6–8 digit numbers, so those pass.
  it.each([
    ["+48", "60010"],
    ["+48", "6001002001"],
    ["+33", "612"],
    ["", "600100200"],
  ])("rejects %s %s", (code, number) => {
    expect(is_valid_phone(code, number)).toBe(false);
  });
});

describe("address_format_issues", () => {
  const ok = { country_code: "PL", postcode: "00-001", dialling_code: "+48", telephone: "600100200" };

  it("passes a valid address", () => {
    expect(address_format_issues(ok, ["billing"])).toEqual([]);
  });

  it("names the field under the prefix", () => {
    expect(address_format_issues({ ...ok, postcode: "00001", telephone: "6001" }, ["shipping"])).toEqual([
      { path: ["shipping", "postcode"], message: "validation.postcode_invalid" },
      { path: ["shipping", "telephone"], message: "validation.phone_invalid" },
    ]);
  });

  it("adds nothing to an empty field or a phone with stray characters", () => {
    expect(address_format_issues({ ...ok, postcode: "", telephone: "" })).toEqual([]);
    expect(address_format_issues({ ...ok, telephone: "+48 600100200" })).toEqual([]);
  });
});
