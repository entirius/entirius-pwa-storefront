// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  change_password_schema,
  type ChangePasswordFormValues,
} from "@/utils/validation/auth.schema";
import { client_change_password } from "@/lib/auth-client";
import { Form, FormError } from "@/components/ui/form";
import { TextField } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/providers/i18n.provider";

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

  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField control={form.control} name="old_password" label={t("auth.current_password")} type="password" autoComplete="current-password" />
        <TextField control={form.control} name="password" label={t("auth.new_password")} hint={t("auth.password_hint")} type="password" autoComplete="new-password" />
        <TextField control={form.control} name="confirm_password" label={t("auth.confirm_new_password")} type="password" autoComplete="new-password" />
        <FormError>{form.formState.errors.root?.message}</FormError>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner className="size-4" /> : t("profile.change_password")}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
