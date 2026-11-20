// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { ForgotPasswordForm as ForgotPasswordFormView } from "@theme/forms/forgot-password-form";
import type { ForgotPasswordFormValues } from "@entirius/storefront-sdk/forms";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { forgot_password_schema } from "@/utils/validation/auth.schema";
import { client_request_password_reset } from "@/lib/auth-client";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

// Asks for the reset mail; the link in it opens /reset-password. The sheet goes back to the login view
// with a notice that does not say whether the e-mail has an account.
export function ForgotPasswordForm({
  onSent,
  onBack,
}: {
  onSent: () => void;
  onBack: () => void;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const form = useForm<ForgotPasswordFormValues>({
    // See LoginForm for the cast.
    resolver: zodResolver(forgot_password_schema as never),
    mode: "onBlur",
    defaultValues: { email: "" },
  });

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      const res = await client_request_password_reset(values);
      if (!res.ok) {
        form.setError("root", { message: res.error === "throttled" ? t("auth.throttled") : t("common.try_again") });
        return;
      }
      onSent();
    });
  });

  return <ForgotPasswordFormView form={form} submit={submit} pending={pending} back={onBack} />;
}
