import { z } from "zod";

// Reusable field primitives. Later auth forms (signup/profile/address) extend these.
// Country-aware zip/phone validation (via libphonenumber-js) will plug in here when those steps land.
export const email_field = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const password_field = z.string().min(1, "Password is required");

export const login_schema = z.object({
  email: email_field,
  password: password_field,
});

export type LoginFormValues = z.infer<typeof login_schema>;

// Login form defaults. `dummy_*` powers the DEBUG-only "Fill test data" tool
// (mirrors the address step); `empty_*` is the real initial state / Clear target.
export const empty_login_defaults: LoginFormValues = { email: "", password: "" };

export const dummy_login_defaults: LoginFormValues = {
  email: "demo@example.com",
  password: "Demo1234!!",
};

// Registration password rules mirror the backend's enforced policy so users don't
// hit surprise server rejections: ≥8 chars, upper + lower, ≥2 digits, ≥2 specials.
export const register_password_field = z
  .string()
  .min(8, "At least 8 characters")
  .refine((v) => /[A-Z]/.test(v), "Add an uppercase letter")
  .refine((v) => /[a-z]/.test(v), "Add a lowercase letter")
  .refine((v) => (v.match(/\d/g) ?? []).length >= 2, "Add at least two digits")
  .refine(
    (v) => (v.match(/[^A-Za-z0-9]/g) ?? []).length >= 2,
    "Add at least two special characters",
  );

export const register_schema = z
  .object({
    email: email_field,
    password: register_password_field,
    confirm_password: z.string().min(1, "Confirm your password"),
    consent_terms: z.boolean().refine((v) => v === true, "You must accept the terms"),
    consent_data: z
      .boolean()
      .refine((v) => v === true, "Required to create an account"),
  })
  .refine((v) => v.password === v.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });

export type RegisterFormValues = z.infer<typeof register_schema>;
