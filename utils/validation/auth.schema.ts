// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { z } from "zod";
import { msg } from "@/lib/i18n/translate";

// Messages are catalogue keys (msg()); <FormMessage> turns them into text in the active language.
// Reusable field primitives. Later auth forms (signup/profile/address) extend these.
// Country-aware zip/phone validation (via libphonenumber-js) will plug in here when those steps land.
export const email_field = z
  .string()
  .min(1, msg("validation.email_required"))
  .email(msg("validation.email_invalid"));

export const password_field = z.string().min(1, msg("validation.password_required"));

export const login_schema = z.object({
  email: email_field,
  password: password_field,
});

export type LoginFormValues = z.infer<typeof login_schema>;

// Login form defaults. `dummy_*` is the local test account: the initial state under
// DEBUG_MODE and the "Fill test data" target. `empty_*` is the initial state otherwise
// and the Clear target.
export const empty_login_defaults: LoginFormValues = { email: "", password: "" };

export const dummy_login_defaults: LoginFormValues = {
  email: "demo@example.com",
  password: "Demo1234!!",
};

// Registration password rules mirror the backend's enforced policy so users don't
// hit surprise server rejections: ≥8 chars, upper + lower, ≥2 digits, ≥2 specials.
export const register_password_field = z
  .string()
  .min(8, msg("validation.password_min"))
  .refine((v) => /[A-Z]/.test(v), msg("validation.password_upper"))
  .refine((v) => /[a-z]/.test(v), msg("validation.password_lower"))
  .refine((v) => (v.match(/\d/g) ?? []).length >= 2, msg("validation.password_digits"))
  .refine(
    (v) => (v.match(/[^A-Za-z0-9]/g) ?? []).length >= 2,
    msg("validation.password_special"),
  );

export const register_schema = z
  .object({
    email: email_field,
    password: register_password_field,
    confirm_password: z.string().min(1, msg("validation.confirm_required")),
    consent_terms: z.boolean().refine((v) => v === true, msg("validation.terms_required")),
    consent_data: z
      .boolean()
      .refine((v) => v === true, msg("validation.data_consent_required")),
  })
  .refine((v) => v.password === v.confirm_password, {
    path: ["confirm_password"],
    message: msg("validation.passwords_mismatch"),
  });

export type RegisterFormValues = z.infer<typeof register_schema>;
