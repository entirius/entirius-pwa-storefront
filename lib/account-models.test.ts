// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { create_i18n } from "@entirius/storefront-sdk/i18n";
import { en } from "@entirius/storefront-sdk/i18n/messages/en";
import { customer_address_lines, order_model, order_summary_model } from "./account-models";
import type { Order } from "@/utils/NORMALIZERS/order.normalizer";

const i18n = create_i18n("en", en);

const address = {
  firstname: "Anna",
  lastname: "Tester",
  street: "Main Street 1",
  city: "Warsaw",
  postcode: "00-001",
  country_code: "PL",
  dialling_code: "+48",
  telephone: "500600700",
  email: "anna@example.com",
  company: "Acme",
  tax_id: "123",
};

const order = (over: Partial<Order> = {}): Order =>
  ({
    id: "1042",
    order_uuid: "u",
    status: "confirmed",
    status_label: "orders.status_confirmed",
    created: "2026-11-02T10:00:00Z",
    updated: "",
    comment: null,
    total: "120.00",
    base_total: "150.00",
    total_tax: "22.44",
    total_netto: "97.56",
    currency_code: "EUR",
    shipping_address: address,
    billing_address: { ...address },
    payment_methods: [{ code: "card", name: "Card", pay_code: null }],
    shipping_method: { code: "dpd", name: "DPD", total_price: "0.00", normal_price: "15.00", delivery_point: null },
    items: [
      {
        sku: "A",
        name: "Chair",
        quantity: 2,
        price: "50.00",
        base_price: "60.00",
        special_percent: 17,
        total_price: "100.00",
        image_url: null,
        sub_items: [{ sku: "A-1", quantity: 1, option_title: null }],
      },
    ],
    ...over,
  }) as Order;

describe("account models", () => {
  it("gives an order on a list its address, status tone and formatted total", () => {
    const model = order_summary_model(
      { id: "1042", order_uuid: "u", status: "canceled", status_label: "orders.status_canceled", created: "2026-11-02T10:00:00Z", total: "120.00", currency_code: "EUR", item_count: 3 },
      i18n,
    );
    expect(model.href).toBe("/profile/orders/1042");
    expect(model.status.tone).toBe("negative");
    expect(model.status.label).not.toBe("orders.status_canceled");
    expect(model.total).toMatch(/120/);
    expect(model.items).toBe(3);
  });

  it("works out an order: the struck regular price, free delivery, savings, and no billing when it is the same", () => {
    const model = order_model(order(), i18n);
    expect(model.lines[0].unit?.regular).toMatch(/60/);
    expect(model.lines[0].unit?.percent).toBe("17");
    expect(model.lines[0].sub_items).toEqual([{ label: "A-1 (SKU)", quantity: 1 }]);
    expect(model.shipping?.free).toBe(true);
    expect(model.shipping?.regular).toMatch(/15/);
    expect(model.summary.saved).toMatch(/30/);
    expect(model.billing_address).toBeNull();
    expect(model.shipping_address?.phone).toBe("+48500600700");
    expect(model.shipping_address?.city).toBe("00-001 Warsaw, PL");
  });

  it("shows a billing address that differs and leaves out savings when there are none", () => {
    const model = order_model(order({ billing_address: { ...address, street: "Office Road 5" }, base_total: "120.00" }), i18n);
    expect(model.billing_address?.street).toBe("Office Road 5");
    expect(model.billing_address?.company).toBe("Acme");
    expect(model.summary.saved).toBeNull();
  });

  it("names a company on a saved address only when it is a company address", () => {
    const saved = { address_id: "a", ...address, is_company: false };
    expect(customer_address_lines(saved).company).toBeNull();
    expect(customer_address_lines({ ...saved, is_company: true }).company).toBe("Acme");
    expect(customer_address_lines(saved).phone).toBe("+48 500600700");
  });
});
