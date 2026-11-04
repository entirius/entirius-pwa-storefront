// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { payment_continue_url, payment_patch_body, success_path } from "./payment-return";

const SHOP = "https://shop.example.org";

describe("payment_patch_body", () => {
  it("carries the success page of the country as continue_url, the order number placeholder literal", () => {
    expect(payment_patch_body("payu", "pl", SHOP)).toEqual({
      code: "payu",
      continue_url: "https://shop.example.org/pl/checkout/success?ref=<order_id>",
    });
    expect(JSON.parse(JSON.stringify(payment_patch_body("payu", "pl", SHOP))).continue_url).toContain("<order_id>");
  });

  it("uses the unprefixed address for the default profile and drops a path or slash of SITE_URL", () => {
    expect(payment_patch_body("stripe", "default", `${SHOP}/`).continue_url).toBe(
      "https://shop.example.org/checkout/success?ref=<order_id>",
    );
    expect(payment_continue_url(undefined, `${SHOP}/any/path`)).toBe(
      "https://shop.example.org/checkout/success?ref=<order_id>",
    );
  });

  it("sends the code alone without an https SITE_URL", () => {
    expect(payment_patch_body("cod", "pl", "http://localhost:3100")).toEqual({ code: "cod" });
    expect(payment_patch_body("cod", "pl", "")).toEqual({ code: "cod" });
  });
});

describe("the URL as the backend returns it", () => {
  // django-checkout: continue_url.replace("<order_id>", order.pretty_id)
  const returned = payment_continue_url("pl", SHOP)!.replace("<order_id>", "0200000013");

  it("lands on the success route with the order number the page reads", () => {
    const url = new URL(returned);
    expect(url.pathname).toBe(success_path("pl"));
    expect(url.searchParams.getAll("ref")).toEqual(["0200000013"]);
  });

  it("keeps ref when the gateway appends its own parameters", () => {
    const url = new URL(`${returned}&error=501`);
    expect(url.searchParams.getAll("ref")).toEqual(["0200000013"]);
  });
});
