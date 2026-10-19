// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  forgot_password_schema,
  type ForgotPasswordFormValues,
} from "@/utils/validation/auth.schema";
import { client_request_password_reset } from "@/lib/auth-client";
import { Form, FormError } from "@/components/ui/form";
import { TextField } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/providers/i18n.provider";

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
        form.setError("root", { message: t("common.try_again") });
        return;
      }
      onSent();
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex flex-col gap-4 p-4">
        <TextField control={form.control} name="email" label={t("auth.email")} type="email" autoComplete="email" />
        <FormError>{form.formState.errors.root?.message}</FormError>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner className="size-4" /> : t("auth.send_reset_link")}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t("auth.back_to_sign_in")}
        </button>
      </form>
    </Form>
  );
}
