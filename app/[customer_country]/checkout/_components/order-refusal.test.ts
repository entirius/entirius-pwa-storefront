// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { order_refusal } from "./order-refusal";

const refused = (error: unknown) => ({ error, message: "English text from the API", debug_id: "x", details: [] });

describe("order_refusal", () => {
  it("sends a missing address, shipping or payment back to its step", () => {
    expect(order_refusal(refused("ADDRESSES_NOT_SELECTED"))).toEqual({ message: "checkout.refused_address", fix: "address" });
    expect(order_refusal(refused("SHIPPING_OPTION_NOT_SELECTED"))).toEqual({
      message: "checkout.refused_shipping",
      fix: "shipping",
    });
    expect(order_refusal(refused("PAYMENT_OPTION_NOT_SELECTED"))).toEqual({ message: "checkout.refused_payment", fix: "payment" });
  });

  it("sends a sold-out item to the cart and a voucher on a split order to the payment", () => {
    expect(order_refusal(refused("OUT_OF_STOCK"))).toEqual({ message: "checkout.refused_out_of_stock", fix: "cart" });
    expect(order_refusal(refused("VOUCHER_NOT_SUPPORTED_ON_SPLIT_ORDER"))).toEqual({
      message: "checkout.refused_voucher_split",
      fix: "payment",
    });
  });

  it("sends every refused discount code and gift rule to the cart", () => {
    for (const code of ["DISCOUNT_EXPIRED", "DISCOUNT_USAGE_LIMIT_REACHED", "DISCOUNT_CODE_INVALID"]) {
      expect(order_refusal(refused(code))).toEqual({ message: "checkout.refused_discount", fix: "cart" });
    }
    expect(order_refusal(refused("GRATIS_QTY_EXCEEDED"))).toEqual({ message: "checkout.refused_gift", fix: "cart" });
  });

  it("gives an unknown code, a missing one or no body the generic message without a way to fix", () => {
    const generic = { message: "checkout.order_failed", fix: null };
    expect(order_refusal(refused("UNPROCESSABLE_ENTITY"))).toEqual(generic);
    expect(order_refusal(refused("toString"))).toEqual(generic);
    expect(order_refusal(refused(409))).toEqual(generic);
    expect(order_refusal({ message: "x" })).toEqual(generic);
    expect(order_refusal(undefined)).toEqual(generic);
    expect(order_refusal("Conflict")).toEqual(generic);
  });
});
