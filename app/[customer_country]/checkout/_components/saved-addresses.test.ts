// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import type { CustomerAddress } from "@/app/[customer_country]/profile/addresses/api.query";
import { empty_address_defaults } from "@/utils/validation/address.schema";
import { book_block, book_to_address_form, matching_address } from "./saved-addresses";

const home: CustomerAddress = {
  address_id: "a1",
  firstname: "Anna",
  lastname: "Tester",
  street: "Testowa 1",
  city: "Warsaw",
  postcode: "00-001",
  telephone: "600100200",
  dialling_code: "+48",
  country_code: "PL",
  is_company: false,
  company: null,
  tax_id: null,
};
const office: CustomerAddress = {
  ...home,
  address_id: "a2",
  street: "Biurowa 5",
  postcode: "10115",
  city: "Berlin",
  country_code: "DE",
  dialling_code: "+49",
  telephone: "30901820",
  is_company: true,
  company: "Tester GmbH",
  tax_id: "DE123456789",
};

describe("book_to_address_form", () => {
  it("fills billing from the default billing address and the profile email", () => {
    const v = book_to_address_form([home, office], { billing_address: "a2", shipping_address: "a2" }, "anna@example.com");
    expect(v.billing).toEqual({ ...book_block(office), email: "anna@example.com" });
    expect(v).toMatchObject({ requested_invoice: true, company: "Tester GmbH", tax_id: "DE123456789" });
    expect(v.ship_to_different).toBe(false);
  });

  it("ships to the default shipping address when it is another entry", () => {
    const v = book_to_address_form([home, office], { billing_address: "a2", shipping_address: "a1" }, "anna@example.com");
    expect(v.ship_to_different).toBe(true);
    expect(v.shipping).toEqual(book_block(home));
  });

  it("takes the first entry without defaults, and only the email without entries", () => {
    const none = { billing_address: null, shipping_address: null };
    expect(book_to_address_form([home, office], none, "a@b.c").billing.street).toBe("Testowa 1");
    expect(book_to_address_form([], none, "a@b.c")).toEqual({
      ...empty_address_defaults,
      billing: { ...empty_address_defaults.billing, email: "a@b.c" },
    });
  });
});

describe("matching_address", () => {
  it("finds the entry the block holds, ignoring outer spaces", () => {
    expect(matching_address({ ...book_block(office), street: " Biurowa 5 " }, [home, office])).toBe("a2");
  });

  it("is null once a field differs", () => {
    expect(matching_address({ ...book_block(home), street: "Testowa 2" }, [home, office])).toBeNull();
  });
});
