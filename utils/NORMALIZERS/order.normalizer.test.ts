// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { NORM_ORDER_SUMMARIES, NORM_PLACED_ORDER, status_style } from "./order.normalizer";

describe("NORM_ORDER_SUMMARIES", () => {
  it("reads a v2 orders/list/ page", () => {
    const page = NORM_ORDER_SUMMARIES({
      count: 21,
      next: "?page=2&page_size=20",
      previous: null,
      results: [
        {
          order_id: "6435143b-2655-4a30-b25b-a3cafe4d9877",
          pretty_id: "0200000013",
          status: "unpaid",
          status_label: "unpaid",
          created: "2026-10-07T11:12:00.479163Z",
          total_gross: "549.00",
          currency: "EUR",
          item_count: 1,
        },
      ],
    });
    expect(page).toEqual({
      orders: [
        {
          id: "0200000013",
          order_uuid: "6435143b-2655-4a30-b25b-a3cafe4d9877",
          status: "unpaid",
          status_label: "unpaid",
          created: "2026-10-07T11:12:00.479163Z",
          total: "549.00",
          currency_code: "EUR",
          item_count: 1,
        },
      ],
      count: 21,
      has_next: true,
    });
  });

  it("marks the last page and survives an empty body", () => {
    expect(NORM_ORDER_SUMMARIES({ count: 0, next: null, results: [] })).toEqual({
      orders: [],
      count: 0,
      has_next: false,
    });
    expect(NORM_ORDER_SUMMARIES(undefined)).toEqual({ orders: [], count: 0, has_next: false });
  });
});

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
