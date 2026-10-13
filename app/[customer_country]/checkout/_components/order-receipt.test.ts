// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { order_refs, transfer_details, type OrderReceipt } from "./order-receipt";

const order = { order_id: "id", pretty_id: "0200000013", status: "", redirect_url: null, payment_error: false };

describe("order_refs", () => {
  it("uses every part of a split order, else the order number", () => {
    expect(order_refs({ ...order, split_pretty_ids: ["A1", "A2"] })).toEqual(["A1", "A2"]);
    expect(order_refs({ ...order, split_pretty_ids: [] })).toEqual(["0200000013"]);
    expect(order_refs({ ...order, pretty_id: "", split_pretty_ids: [] })).toEqual([]);
  });
});

describe("transfer_details", () => {
  const receipt: OrderReceipt = {
    refs: ["0200000013"],
    placed_at: "2026-10-13T10:00:00Z",
    total: "549.00",
    currency: "EUR",
    payment: { name: "Bank Transfer", description: "<p>IBAN&nbsp;DE00 1234</p><p>Bank X</p>", is_transfer: true },
    shipping: null,
  };

  it("strips the markup of the description and adds amount and number", () => {
    expect(transfer_details(receipt, "€549.00", { amount: "Amount", number: "Order" })).toBe(
      "IBAN DE00 1234\nBank X\nAmount: €549.00\nOrder: 0200000013",
    );
  });

  it("works without a description", () => {
    const bare = { ...receipt, payment: { name: "Bank Transfer", description: null, is_transfer: true } };
    expect(transfer_details(bare, "€1.00", { amount: "Amount", number: "Order" })).toBe("Amount: €1.00\nOrder: 0200000013");
  });
});
