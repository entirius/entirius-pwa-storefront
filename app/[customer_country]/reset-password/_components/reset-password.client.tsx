// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  reset_password_schema,
  type ResetPasswordFormValues,
} from "@/utils/validation/auth.schema";
import { client_reset_password } from "@/lib/auth-client";
import { Form, FormError } from "@/components/ui/form";
import { TextField } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LinkDynamic } from "@/lib/link-dynamic";
import { useI18n } from "@/providers/i18n.provider";

// Receiver of the reset mail: /reset-password?key=. The key is checked only when the form is sent, so a
// bad link shows the form first and the "link does not work" state after the submit. Setting the
// password returns no tokens — the customer signs in afterwards (the header User icon opens the Sheet).
export function ResetPasswordClient() {
  const { t } = useI18n();
  const key = useSearchParams().get("key");
  const [status, setStatus] = useState<"form" | "done" | "invalid">(() => (key ? "form" : "invalid"));
  const [pending, startTransition] = useTransition();
  const form = useForm<ResetPasswordFormValues>({
    // See LoginForm for the cast.
    resolver: zodResolver(reset_password_schema as never),
    mode: "onBlur",
    defaultValues: { password: "", confirm_password: "" },
  });

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      const res = await client_reset_password(key ?? "", values);
      if (res.ok) return setStatus("done");
      switch (res.error) {
        case "invalid_key":
          return setStatus("invalid");
        case "passwords_mismatch":
          return form.setError("confirm_password", { message: t("validation.passwords_mismatch") });
        case "password_rejected":
          return form.setError("password", { message: t("auth.password_rejected") });
        default:
          return form.setError("root", { message: t("common.try_again") });
      }
    });
  });

  if (status !== "form") {
    const done = status === "done";
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-3 text-2xl">{t(done ? "auth.reset_done_title" : "auth.reset_invalid_title")}</h1>
        <p className="mb-6 text-muted-foreground">
          {t(done ? "auth.reset_done_text" : "auth.reset_invalid_text")}
        </p>
        <Button asChild variant="outline">
          <LinkDynamic href="/">{t("common.back_to_store")}</LinkDynamic>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-3 text-2xl">{t("auth.reset_title")}</h1>
      <p className="mb-6 text-muted-foreground">{t("auth.reset_intro")}</p>
      <Form {...form}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <TextField control={form.control} name="password" label={t("auth.new_password")} hint={t("auth.password_hint")} type="password" autoComplete="new-password" />
          <TextField control={form.control} name="confirm_password" label={t("auth.confirm_new_password")} type="password" autoComplete="new-password" />
          <FormError>{form.formState.errors.root?.message}</FormError>
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner className="size-4" /> : t("auth.set_password")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
