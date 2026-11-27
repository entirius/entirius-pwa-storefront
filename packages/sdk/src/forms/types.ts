// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { BaseSyntheticEvent, FormEvent, ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { TokenLinksMap } from "../components/token-links";

// The shop's forms: the core validates, sends and keeps the state, a theme's view (`@theme/forms/<name>`) draws the
// fields and the layout from the model it gets in props. Checkout's forms stay the core's.

// A form the core validates with react-hook-form: the view binds its fields to `form.control` (TextField,
// SelectField, CheckboxField from `@theme/ui/form-fields`, inside `<Form {...form}>`), sends with `submit` and
// shows `form.formState.errors.root` (the form's own error) through FormError.
export type ValidatedForm<V extends FieldValues> = {
  form: UseFormReturn<V>;
  submit: (event?: BaseSyntheticEvent) => Promise<void>;
  pending: boolean;
};

export type LoginFormValues = { email: string; password: string };
export type LoginFormModel = ValidatedForm<LoginFormValues> & {
  // A line above the fields (the reset mail is on its way, the session ended).
  notice: string | null;
  // The core's developer tools (DEBUG_MODE: the test account), else null.
  dev_tools: ReactNode;
  forgot_password: () => void;
  register: () => void;
};

export type RegisterFormValues = {
  email: string;
  password: string;
  confirm_password: string;
  // The shop's own pair of boxes, used only while `agreements` is null.
  consent_terms: boolean;
  consent_data: boolean;
  newsletter?: boolean;
  // The ticked backend agreements by slug (the fields are named `accepted.<slug>`).
  accepted?: Record<string, boolean | undefined>;
};
// An agreement of the backend the form offers: `html` is its summary as the backend sends it (render it with
// `RichText`), `required` ones must be ticked, the others are an optional box (the newsletter).
export type RegisterAgreement = { slug: string; html: string; required: boolean };
// `newsletter`: the channel has a newsletter, so the form offers the sign-up box. `agreements`: the definitions the
// CMS meant for registration; one box each, named `accepted.<slug>`, instead of the pair `consent_terms` /
// `consent_data` and the `newsletter` box. Null = the backend has none (or is not answering): draw the shop's own.
export type RegisterFormModel = ValidatedForm<RegisterFormValues> & {
  newsletter: boolean;
  agreements: RegisterAgreement[] | null;
  login: () => void;
};

export type ForgotPasswordFormValues = { email: string };
export type ForgotPasswordFormModel = ValidatedForm<ForgotPasswordFormValues> & { back: () => void };

export type ResetPasswordFormValues = { password: string; confirm_password: string };
export type ResetPasswordFormModel = ValidatedForm<ResetPasswordFormValues>;

export type ProfileFormValues = { firstname: string; lastname: string };
export type ProfileFormModel = ValidatedForm<ProfileFormValues> & { cancel: () => void };

export type ChangePasswordFormValues = { old_password: string; password: string; confirm_password: string };
export type ChangePasswordFormModel = ValidatedForm<ChangePasswordFormValues> & { cancel: () => void };

export type AddressFormValues = {
  firstname: string;
  lastname: string;
  street: string;
  city: string;
  postcode: string;
  country_code: string;
  dialling_code: string;
  telephone: string;
  is_company: boolean;
  company: string;
  tax_id: string;
};
// The address book's sheet. `select_country` also sets the country's dialling code; `company`: the company fields
// show; `postcode_hint`: an example postcode of the chosen country.
export type AddressFormModel = ValidatedForm<AddressFormValues> & {
  open: boolean;
  set_open: (open: boolean) => void;
  title: string;
  countries: { value: string; label: string }[];
  dialling: { value: string; label: string }[];
  select_country: (code: string) => void;
  company: boolean;
  postcode_hint: string | null;
};

// Forms of a few fields and a consent, read by the core from the submitted form (`name` attributes as listed per
// form) and sent with `submit`. `invalid`: a field or the consent is missing.
export type SendState = "idle" | "sending" | "sent" | "failed" | "invalid";

// The consent box: its sentence with `{privacy}` for TokenLinks, checked or not.
export type ConsentModel = { checked: boolean; set: (checked: boolean) => void; text: string; links: TokenLinksMap };

type SentForm<S extends string> = {
  state: S;
  submit: (event: FormEvent<HTMLFormElement>) => void;
  consent: ConsentModel;
  className?: string;
};

// The newsletter sign-up (the footer). Fields: `email`, the honeypot.
export type NewsletterFormModel = SentForm<SendState>;

// A question to the shop (the product page, a CMS page). Fields: `name`, `email`, `message`, the honeypot.
// `trigger`: shown instead of the form until clicked (the product page); `id` keeps the fields' ids apart.
export type EnquiryFormModel = SentForm<SendState> & {
  id: string;
  title: string;
  open: boolean;
  open_form: () => void;
  trigger: { label: string; primary: boolean } | null;
};

// "Tell me when a similar product arrives" (a sold-out product). Fields: `email`, `note`, the honeypot.
export type NotifySimilarFormModel = SentForm<SendState> & {
  title: string;
  open: boolean;
  open_form: () => void;
  trigger_label: string;
};

// "Tell me when it is back" for one sold-out SKU. Fields: `email` (controlled: the signed-in customer's address
// until they type their own), the honeypot. `saved`: the request is in (`fresh`: during this visit, announced and
// focused); `error`: the message to show.
export type StockAlertFormModel = SentForm<"idle" | "sending" | "saved" | "in_stock" | "throttled" | "invalid" | "failed"> & {
  title_line: string;
  email: { value: string; set: (value: string) => void };
  error: string | null;
  saved: { text: string; fresh: boolean; change: () => void } | null;
};

// The cart's discount codes: the field, applying a code, the applied ones with their removal.
export type DiscountCodeModel = {
  value: string;
  set_value: (value: string) => void;
  apply: (event: FormEvent) => void;
  can_apply: boolean;
  pending: boolean;
  message: string | null;
  applied: { code: string; remove: () => void }[];
};
