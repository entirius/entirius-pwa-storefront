// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { z } from "zod";
import { msg, type MessageKey } from "@/lib/i18n/translate";

// Address-book entry (accounts service). Distinct from the checkout billing+shipping
// `address_schema` — this is a single customer address.

const req = (message: MessageKey) => z.string().trim().min(1, message);
const phone_field = z
  .string()
  .trim()
  .min(1, msg("validation.phone_required"))
  .regex(/^[0-9()\s-]{4,}$/, msg("validation.phone_invalid"));

export const customer_address_schema = z
  .object({
    firstname: req("validation.firstname_required"),
    lastname: req("validation.lastname_required"),
    street: req("validation.street_required"),
    city: req("validation.city_required"),
    postcode: req("validation.postcode_required"),
    country_code: req("validation.country_required"),
    dialling_code: req("validation.dialling_code_required"),
    telephone: phone_field,
    is_company: z.boolean(),
    company: z.string(),
    tax_id: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.is_company) {
      if (!v.company.trim())
        ctx.addIssue({ path: ["company"], code: "custom", message: msg("validation.company_required") });
      if (!v.tax_id.trim())
        ctx.addIssue({ path: ["tax_id"], code: "custom", message: msg("validation.tax_id_required") });
    }
  });

export type CustomerAddressFormValues = z.infer<typeof customer_address_schema>;

export const empty_customer_address: CustomerAddressFormValues = {
  firstname: "",
  lastname: "",
  street: "",
  city: "",
  postcode: "",
  country_code: "PL",
  dialling_code: "+48",
  telephone: "",
  is_company: false,
  company: "",
  tax_id: "",
};

// PUT/PATCH body — the backend requires the full address on update (not partial).
// company/tax_id only when is_company.
export function to_customer_address_body(v: CustomerAddressFormValues) {
  return {
    firstname: v.firstname,
    lastname: v.lastname,
    street: v.street,
    city: v.city,
    postcode: v.postcode,
    country_code: v.country_code,
    dialling_code: v.dialling_code,
    telephone: v.telephone,
    is_company: v.is_company,
    company: v.is_company ? v.company : null,
    tax_id: v.is_company ? v.tax_id : null,
  };
}
