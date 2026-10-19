// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { disallowed } from "./robots";

// Google's matching: a rule is a prefix of path + query, `*` is any run of characters, a trailing `$` ends
// the address. With `Allow: /` as the only allow rule, any matching disallow rule closes the address.
const blocked = (url: string) =>
  disallowed().some((rule) => {
    const pattern = rule.replace(/[.+?^{}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${pattern.endsWith("$") ? pattern : pattern + ".*"}`).test(url);
  });

describe("robots disallow rules", () => {
  it.each([
    "/cart",
    "/cart?step=2",
    "/default/cart",
    "/default/cart/",
    "/default/checkout/success",
    "/uk/checkout?ref=1",
    "/default/profile/orders/5",
    "/default/user-handler",
    "/default/reset-password?key=abc",
    "/default/catalog/chairs?q_color=red",
    "/default/catalog/chairs?page=2&s_price=asc",
    "/default/catalog/chairs?r_price=10-20",
  ])("closes %s", (url) => {
    expect(blocked(url)).toBe(true);
  });

  it.each([
    "/default",
    "/default/product/cartoon-mug",
    "/default/catalog/profiles",
    "/default/cart-guide",
    "/cart-guide",
    "/default/product/checkout-desk",
    "/default/catalog/chairs?page=2",
    "/default/catalog/chairs?items_per_row=4",
  ])("leaves %s open", (url) => {
    expect(blocked(url)).toBe(false);
  });
});
