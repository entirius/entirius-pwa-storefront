// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ChangePasswordFormModel } from "@entirius/storefront-sdk/forms";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";
import { Form, FormError } from "@theme/ui/form";
import { TextField } from "@theme/ui/form-fields";
import { Spinner } from "@theme/ui/spinner";

// The password change on the account overview: the current one, the new one twice.
export function ChangePasswordForm({ form, submit, pending, cancel }: ChangePasswordFormModel) {
  const { t } = useI18n();
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
          <Button type="button" variant="ghost" onClick={cancel}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
