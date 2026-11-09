// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { expect, type APIRequestContext } from "@playwright/test";
import { WISHLIST, customer_auth } from "./account";

// The customer's wishlist through the accounts API, as another device sees it. Needs the accounts product list
// filled from PIM (the test package seed does it); otherwise every add answers 400.

export async function save_wishlist(request: APIRequestContext, email: string, skus: string[]) {
  const headers = await customer_auth(request, email);
  const res = await request.post(`${WISHLIST}product/`, { headers, data: { sku: skus } });
  expect(res.ok(), await res.text()).toBe(true);
}

// The SKUs on the account; [] while the customer has no wishlist yet (the API answers 400).
export async function account_wishlist(request: APIRequestContext, email: string): Promise<string[]> {
  const res = await request.get(WISHLIST, { headers: await customer_auth(request, email) });
  if (res.status() === 400) return [];
  expect(res.ok(), await res.text()).toBe(true);
  return ((await res.json()).data.products ?? []).map((p: { sku: string }) => p.sku).sort();
}
