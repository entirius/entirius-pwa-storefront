// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ResetPasswordFormModel } from "@entirius/storefront-sdk/forms";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";
import { Form, FormError } from "@theme/ui/form";
import { TextField } from "@theme/ui/form-fields";
import { Spinner } from "@theme/ui/spinner";

// The new password from the reset link, twice.
export function ResetPasswordForm({ form, submit, pending }: ResetPasswordFormModel) {
  const { t } = useI18n();
  return (
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
  );
}
