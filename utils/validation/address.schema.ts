import { z } from "zod";
import { email_field } from "./auth.schema";
import type { Cart, CartAddress } from "@/utils/NORMALIZERS/cart.normalizer";

// Checkout address step. Backend contract (checkout/v2, live-probed):
// PATCH /carts/{cid}/addresses/ { shipping_address, billing_address }.
//  - shipping_address needs: firstname,lastname,street,city,postcode,country_code,
//    telephone,dialling_code (no email).
//  - billing_address needs those + email; optional requested_invoice -> company,tax_id.
// Phone kept to a simple digit check for now (libphonenumber-js deferred).

const req = (label: string) => z.string().trim().min(1, `${label} is required`);
const phone_field = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .regex(/^[0-9()\s-]{4,}$/, "Enter a valid phone number");

const address_fields = {
  firstname: req("First name"),
  lastname: req("Last name"),
  street: req("Street"),
  city: req("City"),
  postcode: req("Postal code"),
  country_code: req("Country"),
  dialling_code: req("Dialling code"),
  telephone: phone_field,
};

// Shipping block is only validated when `ship_to_different` is on, so its fields are
// permissive at the type level and enforced conditionally in superRefine below.
const loose_address = z.object({
  firstname: z.string(),
  lastname: z.string(),
  street: z.string(),
  city: z.string(),
  postcode: z.string(),
  country_code: z.string(),
  dialling_code: z.string(),
  telephone: z.string(),
});

const SHIP_LABELS: Record<string, string> = {
  firstname: "First name",
  lastname: "Last name",
  street: "Street",
  city: "City",
  postcode: "Postal code",
  country_code: "Country",
  dialling_code: "Dialling code",
  telephone: "Phone number",
};

export const address_schema = z
  .object({
    billing: z.object({ email: email_field, ...address_fields }),
    requested_invoice: z.boolean(),
    company: z.string(),
    tax_id: z.string(),
    ship_to_different: z.boolean(),
    shipping: loose_address,
  })
  .superRefine((v, ctx) => {
    if (v.requested_invoice) {
      if (!v.company.trim())
        ctx.addIssue({ path: ["company"], code: "custom", message: "Company is required" });
      if (!v.tax_id.trim())
        ctx.addIssue({ path: ["tax_id"], code: "custom", message: "Tax ID is required" });
    }
    if (v.ship_to_different) {
      for (const key of Object.keys(SHIP_LABELS)) {
        if (!String((v.shipping as Record<string, string>)[key] ?? "").trim())
          ctx.addIssue({
            path: ["shipping", key],
            code: "custom",
            message: `${SHIP_LABELS[key]} is required`,
          });
      }
    }
  });

export type AddressFormValues = z.infer<typeof address_schema>;

// Country → default dialling code. Small curated set (this channel ships EU + UK).
export const COUNTRY_OPTIONS = [
  { code: "PL", name: "Poland", dialling_code: "+48" },
  { code: "DE", name: "Germany", dialling_code: "+49" },
  { code: "FR", name: "France", dialling_code: "+33" },
  { code: "ES", name: "Spain", dialling_code: "+34" },
  { code: "IT", name: "Italy", dialling_code: "+39" },
  { code: "NL", name: "Netherlands", dialling_code: "+31" },
  { code: "GB", name: "United Kingdom", dialling_code: "+44" },
] as const;

export const DIALLING_OPTIONS = COUNTRY_OPTIONS.map((c) => c.dialling_code);

// Build the PATCH /addresses/ body from the flat form values.
export function to_addresses_body(v: AddressFormValues) {
  const b = v.billing;
  const billing_address = {
    email: b.email,
    firstname: b.firstname,
    lastname: b.lastname,
    street: b.street,
    city: b.city,
    postcode: b.postcode,
    country_code: b.country_code,
    telephone: b.telephone,
    dialling_code: b.dialling_code,
    ...(v.requested_invoice
      ? { requested_invoice: true, company: v.company, tax_id: v.tax_id }
      : {}),
  };
  const src = v.ship_to_different ? v.shipping : b;
  const shipping_address = {
    firstname: src.firstname,
    lastname: src.lastname,
    street: src.street,
    city: src.city,
    postcode: src.postcode,
    country_code: src.country_code,
    telephone: src.telephone,
    dialling_code: src.dialling_code,
  };
  return { billing_address, shipping_address };
}

export const empty_address_defaults: AddressFormValues = {
  billing: {
    email: "",
    firstname: "",
    lastname: "",
    street: "",
    city: "",
    postcode: "",
    country_code: "PL",
    dialling_code: "+48",
    telephone: "",
  },
  requested_invoice: false,
  company: "",
  tax_id: "",
  ship_to_different: false,
  shipping: {
    firstname: "",
    lastname: "",
    street: "",
    city: "",
    postcode: "",
    country_code: "PL",
    dialling_code: "+48",
    telephone: "",
  },
};

// The 8 shared address fields (no email) → form block, filling gaps from the
// PL/+48 defaults so the country/dialling selects always have a valid value.
function to_block(a: CartAddress, fallback: AddressFormValues["shipping"]) {
  return {
    firstname: a.firstname ?? fallback.firstname,
    lastname: a.lastname ?? fallback.lastname,
    street: a.street ?? fallback.street,
    city: a.city ?? fallback.city,
    postcode: a.postcode ?? fallback.postcode,
    country_code: a.country_code ?? fallback.country_code,
    dialling_code: a.dialling_code ?? fallback.dialling_code,
    telephone: a.telephone ?? fallback.telephone,
  };
}

// True when the shipping address meaningfully differs from billing (so the
// "ship to different address" toggle should open pre-filled).
function addresses_differ(b: CartAddress, s: CartAddress) {
  return (["firstname", "lastname", "street", "city", "postcode", "country_code", "telephone"] as const).some(
    (k) => (s[k] ?? "") !== (b[k] ?? ""),
  );
}

// Map a synced backend cart's stored addresses → form values, so a returning /
// reloading user sees their saved data instead of blanks. Returns null when the
// cart has no billing address yet (nothing to hydrate — keep empty defaults).
export function cart_to_address_form(
  cart: Cart | null | undefined,
): AddressFormValues | null {
  const b = cart?.billing_address;
  if (!b) return null;
  const billing = {
    email: b.email ?? "",
    ...to_block(b, empty_address_defaults.shipping),
  };
  const s = cart.shipping_address;
  const ship_to_different = !!s && addresses_differ(b, s);
  return {
    billing,
    requested_invoice: b.requested_invoice || !!b.tax_id || !!b.company,
    company: b.company ?? "",
    tax_id: b.tax_id ?? "",
    ship_to_different,
    shipping: ship_to_different
      ? to_block(s!, empty_address_defaults.shipping)
      : empty_address_defaults.shipping,
  };
}

// DEBUG-only convenience: billing block pre-filled (shipping empty, toggles off).
export const dummy_address_defaults: AddressFormValues = {
  ...empty_address_defaults,
  billing: {
    email: "demo@example.com",
    firstname: "John",
    lastname: "Doe",
    street: "Test Street 1",
    city: "Warsaw",
    postcode: "00-001",
    country_code: "PL",
    dialling_code: "+48",
    telephone: "666555444",
  },
};
