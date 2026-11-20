// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ForgotPasswordFormModel } from "@entirius/storefront-sdk/forms";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";
import { Form, FormError } from "@theme/ui/form";
import { TextField } from "@theme/ui/form-fields";
import { Spinner } from "@theme/ui/spinner";

// Asking for the reset mail (the account sheet).
export function ForgotPasswordForm({ form, submit, pending, back }: ForgotPasswordFormModel) {
  const { t } = useI18n();
  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex flex-col gap-4 p-4">
        <TextField control={form.control} name="email" label={t("auth.email")} type="email" autoComplete="email" />
        <FormError>{form.formState.errors.root?.message}</FormError>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner className="size-4" /> : t("auth.send_reset_link")}
        </Button>
        <button type="button" onClick={back} className="text-sm text-muted-foreground hover:text-foreground">
          {t("auth.back_to_sign_in")}
        </button>
      </form>
    </Form>
  );
}
