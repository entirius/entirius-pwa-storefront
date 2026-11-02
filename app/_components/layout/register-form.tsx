// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  register_schema,
  type RegisterFormValues,
} from "@/utils/validation/auth.schema";
import { client_register } from "@/lib/auth-client";
import { subscribe_newsletter, useNewsletterAvailable } from "@/lib/newsletter";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import {
  Form,
  FormError,
} from "@/components/ui/form";
import { CheckboxField, TextField } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/providers/i18n.provider";

export function RegisterForm({
  onSwitchToLogin,
  onRegistered,
}: {
  onSwitchToLogin: () => void;
  onRegistered: () => void;
}) {
  const { t, text, language } = useI18n();
  const [pending, startTransition] = useTransition();
  const newsletter = useNewsletterAvailable();
  const api = useMemo(() => create_api(make_client_access()), []);
  const form = useForm<RegisterFormValues>({
    // Same nominal zod type-brand cast as login-form (duplicate zod@4 in the tree).
    resolver: zodResolver(register_schema as never),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirm_password: "",
      consent_terms: false,
      consent_data: false,
      newsletter: false,
    },
  });

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      const res = await client_register(values);
      if (!res.ok) {
        form.setError(res.field, { message: text(res.message) });
        return;
      }
      // The account exists either way; the newsletter has its own double opt-in mail.
      if (newsletter && values.newsletter) await subscribe_newsletter(api, values.email, language);
      onRegistered();
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex flex-col gap-4 p-4">
        <TextField control={form.control} name="email" label={t("auth.email")} type="email" autoComplete="email" />
        <TextField control={form.control} name="password" label={t("auth.password")} hint={t("auth.password_hint")} type="password" autoComplete="new-password" />
        <TextField control={form.control} name="confirm_password" label={t("auth.confirm_password")} type="password" autoComplete="new-password" />
        <CheckboxField control={form.control} name="consent_terms" label={t("auth.accept_terms")} />
        <CheckboxField control={form.control} name="consent_data" label={t("auth.consent_data")} />
        {newsletter && (
          <CheckboxField control={form.control} name="newsletter" label={t("newsletter.signup_opt_in")} />
        )}
        <FormError>{form.formState.errors.root?.message}</FormError>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner className="size-4" /> : t("auth.create_account")}
        </Button>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t("auth.have_account")}{" "}
          <span className="underline">{t("auth.sign_in")}</span>
        </button>
      </form>
    </Form>
  );
}
