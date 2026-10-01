// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { NORM_PLACED_ORDER, status_style } from "./order.normalizer";

describe("NORM_PLACED_ORDER", () => {
  it("reads the POST orders/ response", () => {
    expect(
      NORM_PLACED_ORDER({
        order_id: "c0ffee",
        order_pretty_id: "0200000003",
        order_status: "UNPAID",
        redirect_url: null,
        split_orders_pretty_ids: [],
      }),
    ).toEqual({
      order_id: "c0ffee",
      pretty_id: "0200000003",
      status: "UNPAID",
      redirect_url: null,
      split_pretty_ids: [],
      payment_error: false,
    });
  });

  it("carries a gateway, split parts and a payment error", () => {
    const o = NORM_PLACED_ORDER({
      order_pretty_id: "A1",
      redirect_url: "https://gw.example/pay",
      split_orders_pretty_ids: ["A1", "A2"],
      payment_error: true,
    });
    expect(o.redirect_url).toBe("https://gw.example/pay");
    expect(o.split_pretty_ids).toEqual(["A1", "A2"]);
    expect(o.payment_error).toBe(true);
  });

  it("survives an empty body", () => {
    expect(NORM_PLACED_ORDER(undefined)).toMatchObject({ pretty_id: "", redirect_url: null, split_pretty_ids: [], payment_error: false });
  });
});

describe("status_style", () => {
  it("maps known statuses to brand status tokens and falls back to neutral", () => {
    expect(status_style("unpaid").text).toBe("text-notice");
    expect(status_style("confirmed").text).toBe("text-positive");
    expect(status_style("whatever")).toEqual({ bg: "bg-muted", text: "text-foreground" });
  });
});
