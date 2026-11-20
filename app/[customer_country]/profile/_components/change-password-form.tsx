// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { ChangePasswordForm as ChangePasswordFormView } from "@theme/forms/change-password-form";
import type { ChangePasswordFormValues } from "@entirius/storefront-sdk/forms";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { change_password_schema } from "@/utils/validation/auth.schema";
import { client_change_password } from "@/lib/auth-client";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

// The session stays signed in after the change: the backend keeps the issued tokens valid.
export function ChangePasswordForm({
  onChanged,
  onCancel,
}: {
  onChanged: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const form = useForm<ChangePasswordFormValues>({
    // Same nominal zod type-brand cast used across the auth forms.
    resolver: zodResolver(change_password_schema as never),
    mode: "onBlur",
    defaultValues: { old_password: "", password: "", confirm_password: "" },
  });

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      const res = await client_change_password(values);
      if (res.ok) return onChanged();
      switch (res.error) {
        case "old_password_invalid":
          return form.setError("old_password", { message: t("auth.old_password_invalid") });
        case "passwords_mismatch":
          return form.setError("confirm_password", { message: t("validation.passwords_mismatch") });
        case "password_rejected":
          return form.setError("password", { message: t("auth.password_rejected") });
        default:
          return form.setError("root", { message: t("common.try_again") });
      }
    });
  });

  return <ChangePasswordFormView form={form} submit={submit} pending={pending} cancel={onCancel} />;
}
