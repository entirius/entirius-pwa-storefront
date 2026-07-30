import { z } from "zod";

// Address-book entry (accounts service). Distinct from the checkout billing+shipping
// `address_schema` — this is a single customer address. Reuses the shared country/
// dialling options and validator style from address.schema.ts.
export { COUNTRY_OPTIONS, DIALLING_OPTIONS } from "./address.schema";

const req = (label: string) => z.string().trim().min(1, `${label} is required`);
const phone_field = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .regex(/^[0-9()\s-]{4,}$/, "Enter a valid phone number");

export const customer_address_schema = z
  .object({
    firstname: req("First name"),
    lastname: req("Last name"),
    street: req("Street"),
    city: req("City"),
    postcode: req("Postal code"),
    country_code: req("Country"),
    dialling_code: req("Dialling code"),
    telephone: phone_field,
    is_company: z.boolean(),
    company: z.string(),
    tax_id: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.is_company) {
      if (!v.company.trim())
        ctx.addIssue({ path: ["company"], code: "custom", message: "Company is required" });
      if (!v.tax_id.trim())
        ctx.addIssue({ path: ["tax_id"], code: "custom", message: "Tax ID is required" });
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
