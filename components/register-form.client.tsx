// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { RegisterForm as RegisterFormView } from "@theme/forms/register-form";
import type { RegisterFormValues } from "@entirius/storefront-sdk/forms";
import { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { register_schema_for } from "@/utils/validation/auth.schema";
import { client_register } from "@/lib/auth-client";
import { record_registration_agreements, useContextDefinitions } from "@/lib/agreements";
import { subscribe_newsletter, useNewsletterAvailable } from "@/lib/newsletter";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { registration_agreements, registration_choice } from "@/utils/NORMALIZERS/agreement.normalizer";
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
  // The definitions the CMS meant for registration; null = the shop's own pair of boxes.
  const { data: definitions } = useContextDefinitions(language, "registration");
  const agreements = useMemo(() => registration_agreements(definitions, newsletter), [definitions, newsletter]);
  // The resolver is read on every validation, so the schema follows the boxes on screen.
  const form = useForm<RegisterFormValues>({
    resolver: (values, context, options) => zodResolver(register_schema_for(agreements))(values, context, options),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirm_password: "",
      consent_terms: false,
      consent_data: false,
      newsletter: false,
      accepted: {},
    },
  });

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      const res = await client_register(values, agreements);
      if (!res.ok) {
        form.setError(res.field, { message: text(res.message) });
        return;
      }
      // The account exists either way. What the customer ticked is recorded with django-agreements; the newsletter
      // has its own double opt-in mail.
      const choice = agreements
        ? registration_choice(agreements, values.accepted)
        : { consents: [], newsletter: newsletter && !!values.newsletter };
      await record_registration_agreements(api, values.email, choice.consents);
      if (choice.newsletter) await subscribe_newsletter(api, values.email, language);
      onRegistered();
    });
  });

  return <RegisterFormView form={form} submit={submit} pending={pending} newsletter={newsletter} agreements={agreements} login={onSwitchToLogin} />;
}
