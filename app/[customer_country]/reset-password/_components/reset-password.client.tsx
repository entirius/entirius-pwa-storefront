// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { reset_password_schema } from "@/utils/validation/auth.schema";
import type { ResetPasswordFormValues } from "@entirius/storefront-sdk/forms";
import { client_reset_password } from "@/lib/auth-client";
import { MessagePage } from "@theme/components/message-page";
import { ResetPasswordPage } from "@theme/account/reset-password-page";
import { ResetPasswordForm } from "@theme/forms/reset-password-form";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

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
      <MessagePage
        pending={false}
        title={t(done ? "auth.reset_done_title" : "auth.reset_invalid_title")}
        text={t(done ? "auth.reset_done_text" : "auth.reset_invalid_text")}
        action={{ label: t("common.back_to_store"), href: "/" }}
      />
    );
  }

  return <ResetPasswordPage form={<ResetPasswordForm form={form} submit={submit} pending={pending} />} />;
}
