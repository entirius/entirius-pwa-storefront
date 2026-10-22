// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { parsePhoneNumberFromString } from "libphonenumber-js";

// Per-country rules of an address: the postal code format and a phone number that fits the dialling code.
// Shared by the checkout addresses (address.schema.ts) and the address book (customer-address.schema.ts).

// Characters a phone number may be typed with; the dialling code has its own field, so no `+`.
export const PHONE_CHARS = /^[0-9()\s-]{4,}$/;

// Postal code per country (ISO 3166-1 alpha-2): the pattern is matched against the trimmed, upper-cased
// value; the example is shown as the field's hint. A country missing here gets no format check.
const POSTCODES: Record<string, { pattern: RegExp; example: string }> = {
  AT: { pattern: /^\d{4}$/, example: "1010" },
  BE: { pattern: /^\d{4}$/, example: "1000" },
  BG: { pattern: /^\d{4}$/, example: "1000" },
  CH: { pattern: /^\d{4}$/, example: "8001" },
  CY: { pattern: /^\d{4}$/, example: "1010" },
  CZ: { pattern: /^\d{3} ?\d{2}$/, example: "110 00" },
  DE: { pattern: /^\d{5}$/, example: "10115" },
  DK: { pattern: /^\d{4}$/, example: "1050" },
  EE: { pattern: /^\d{5}$/, example: "10111" },
  ES: { pattern: /^\d{5}$/, example: "28001" },
  FI: { pattern: /^\d{5}$/, example: "00100" },
  FR: { pattern: /^\d{5}$/, example: "75001" },
  GB: { pattern: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/, example: "SW1A 1AA" },
  GR: { pattern: /^\d{3} ?\d{2}$/, example: "105 57" },
  HR: { pattern: /^\d{5}$/, example: "10000" },
  HU: { pattern: /^\d{4}$/, example: "1051" },
  IT: { pattern: /^\d{5}$/, example: "00118" },
  LT: { pattern: /^(LT-)?\d{5}$/, example: "01100" },
  LU: { pattern: /^(L-)?\d{4}$/, example: "1009" },
  LV: { pattern: /^(LV-)?\d{4}$/, example: "LV-1050" },
  MT: { pattern: /^[A-Z]{3} ?\d{4}$/, example: "VLT 1117" },
  NL: { pattern: /^\d{4} ?[A-Z]{2}$/, example: "1012 AB" },
  NO: { pattern: /^\d{4}$/, example: "0150" },
  PL: { pattern: /^\d{2}-\d{3}$/, example: "00-001" },
  PT: { pattern: /^\d{4}-\d{3}$/, example: "1000-001" },
  RO: { pattern: /^\d{6}$/, example: "010011" },
  SE: { pattern: /^\d{3} ?\d{2}$/, example: "111 22" },
  SI: { pattern: /^\d{4}$/, example: "1000" },
  SK: { pattern: /^\d{3} ?\d{2}$/, example: "811 01" },
  UA: { pattern: /^\d{5}$/, example: "01001" },
  US: { pattern: /^\d{5}(-\d{4})?$/, example: "10001" },
};

export function postcode_example(country_code: string): string | null {
  return POSTCODES[country_code.toUpperCase()]?.example ?? null;
}

// An empty code is the "required" rule's business, not this one's.
export function is_valid_postcode(country_code: string, postcode: string): boolean {
  const rule = POSTCODES[country_code.toUpperCase()];
  const value = postcode.trim().toUpperCase();
  return !rule || !value || rule.pattern.test(value);
}

// A number of a plausible length for the country of the dialling code. libphonenumber-js with its default
// `min` metadata checks the length, not the digit ranges (80 kB instead of ~145 kB).
export function is_valid_phone(dialling_code: string, telephone: string): boolean {
  const calling_code = dialling_code.replace(/\D/g, "");
  if (!calling_code) return false;
  return parsePhoneNumberFromString(telephone, { defaultCallingCode: calling_code })?.isValid() ?? false;
}

type AddressBlock = { country_code: string; postcode: string; dialling_code: string; telephone: string };
type Issue = { path: (string | number)[]; message: "validation.postcode_invalid" | "validation.phone_invalid" };

// Format issues of one address, under `prefix` (["billing"], ["shipping"] or [] for a lone address).
// Empty fields and a phone with stray characters already have their own issue: no second one.
export function address_format_issues(block: AddressBlock, prefix: string[] = []): Issue[] {
  const issues: Issue[] = [];
  if (!is_valid_postcode(block.country_code, block.postcode))
    issues.push({ path: [...prefix, "postcode"], message: "validation.postcode_invalid" });
  const phone = block.telephone.trim();
  if (PHONE_CHARS.test(phone) && !is_valid_phone(block.dialling_code, phone))
    issues.push({ path: [...prefix, "telephone"], message: "validation.phone_invalid" });
  return issues;
}
