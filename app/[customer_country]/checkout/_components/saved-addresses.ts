// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type {
  AddressDefaults,
  CustomerAddress,
} from "@/app/[customer_country]/profile/addresses/api.query";
import {
  empty_address_defaults,
  type AddressFormValues,
} from "@/utils/validation/address.schema";

// The signed-in customer's address book in the checkout address step.

type Block = AddressFormValues["shipping"];

const BLOCK_KEYS = [
  "firstname",
  "lastname",
  "street",
  "city",
  "postcode",
  "country_code",
  "dialling_code",
  "telephone",
] as const;

// An address-book entry as a form block (the 8 fields billing and shipping share).
export function book_block(a: CustomerAddress): Block {
  return Object.fromEntries(BLOCK_KEYS.map((k) => [k, a[k] ?? ""])) as Block;
}

// The entry the block holds field for field; null when the block was typed in or edited since.
export function matching_address(block: Block, addresses: CustomerAddress[]): string | null {
  const found = addresses.find((a) => {
    const entry = book_block(a);
    return BLOCK_KEYS.every((k) => entry[k].trim() === (block[k] ?? "").trim());
  });
  return found?.address_id ?? null;
}

// The invoice fields an entry brings to the billing block: a company address asks for an invoice.
export function book_invoice(a: CustomerAddress) {
  return {
    requested_invoice: a.is_company,
    company: a.is_company ? (a.company ?? "") : "",
    tax_id: a.is_company ? (a.tax_id ?? "") : "",
  };
}

// Form values for a cart without an address: the default billing address (else the first saved one) with the
// profile's email, and the default shipping address when it is another entry.
export function book_to_address_form(
  addresses: CustomerAddress[],
  defaults: AddressDefaults,
  email: string,
): AddressFormValues {
  const by_id = (id: string | null) => addresses.find((a) => a.address_id === id);
  const billing = by_id(defaults.billing_address) ?? addresses[0];
  const shipping = by_id(defaults.shipping_address);
  const ship_to_different = !!billing && !!shipping && shipping.address_id !== billing.address_id;
  return {
    ...empty_address_defaults,
    billing: {
      ...empty_address_defaults.billing,
      ...(billing ? book_block(billing) : {}),
      email,
    },
    ...(billing ? book_invoice(billing) : {}),
    ship_to_different,
    shipping: ship_to_different ? book_block(shipping) : empty_address_defaults.shipping,
  };
}
