// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { RegisterForm as RegisterFormView } from "@theme/forms/register-form";
import type { RegisterFormValues } from "@entirius/storefront-sdk/forms";
import { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { register_schema } from "@/utils/validation/auth.schema";
import { client_register } from "@/lib/auth-client";
import { subscribe_newsletter, useNewsletterAvailable } from "@/lib/newsletter";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

export function RegisterForm({
  onSwitchToLogin,
  onRegistered,
}: {
  onSwitchToLogin: () => void;
  onRegistered: () => void;
}) {
  const { text, language } = useI18n();
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

  return <RegisterFormView form={form} submit={submit} pending={pending} newsletter={newsletter} login={onSwitchToLogin} />;
}
