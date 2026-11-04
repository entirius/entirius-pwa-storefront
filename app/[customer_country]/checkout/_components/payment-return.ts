// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { SITE_URL } from "@/lib/seo/config";
import { profile_path } from "@/lib/profile-path";

const CHECKOUT_SUCCESS_PATH = "/checkout/success";
// The checkout replaces this placeholder with the order number (`pretty_id`) before the gateway gets the URL
// (v2 `PATCH payment/` takes `continue_url` after django-checkout 10.0.1; older ones ignore the field). Written
// literally: `URL` / `URLSearchParams` would encode it to `%3Corder_id%3E`, which the backend does not replace.
const ORDER_NUMBER_PLACEHOLDER = "<order_id>";

// The success page of a country profile: `/pl/checkout/success`, `/checkout/success` for `default`.
export function success_path(country: string | null | undefined): string {
  return profile_path(country, CHECKOUT_SUCCESS_PATH);
}

// Where the payment gateway (PayU, Stripe hosted checkout) sends the customer back: the success page on the
// public shop address (SITE_URL joined as the canonical URLs join it), `ref` = the order number. Null without an
// https SITE_URL (local dev on http): the checkout refuses a non-https target by default, and the PATCH would fail
// for every method.
export function payment_continue_url(country: string | null | undefined, site_url: string = SITE_URL): string | null {
  const base = site_url.trim().replace(/\/+$/, "");
  if (!/^https:\/\/[^/]/i.test(base)) return null;
  return `${base}${success_path(country)}?ref=${ORDER_NUMBER_PLACEHOLDER}`;
}

// Body of `PATCH carts/{id}/payment/`.
export function payment_patch_body(code: string, country: string | null | undefined, site_url: string = SITE_URL) {
  const continue_url = payment_continue_url(country, site_url);
  return continue_url ? { code, continue_url } : { code };
}

// The success page shows the "payment failed" notice: our own `payment=failed` (no gateway session) or the
// gateway's failure on the way back (PayU appends `error=501` to continueUrl).
export function payment_failed(params: Pick<URLSearchParams, "get" | "has">): boolean {
  return params.get("payment") === "failed" || params.has("error");
}
