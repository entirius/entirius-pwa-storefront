// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { LoginFormModel } from "@entirius/storefront-sdk/forms";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";
import { Form, FormError } from "@theme/ui/form";
import { TextField } from "@theme/ui/form-fields";
import { Spinner } from "@theme/ui/spinner";

// Signing in (the account sheet): e-mail and password, the reset link and the way to a new account.
export function LoginForm({ form, submit, pending, notice, dev_tools, forgot_password, register }: LoginFormModel) {
  const { t } = useI18n();
  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex flex-col gap-4 p-4">
        {dev_tools}
        {notice && <p className="rounded-md bg-accent p-3 text-sm text-accent-foreground">{notice}</p>}
        <TextField control={form.control} name="email" label={t("auth.email")} type="email" autoComplete="email" />
        <TextField control={form.control} name="password" label={t("auth.password")} type="password" autoComplete="current-password" />
        <button
          type="button"
          onClick={forgot_password}
          className="self-start text-sm text-muted-foreground underline hover:text-foreground"
        >
          {t("auth.forgot_password")}
        </button>
        <FormError>{form.formState.errors.root?.message}</FormError>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner className="size-4" /> : t("auth.sign_in")}
        </Button>
        <button type="button" onClick={register} className="text-sm text-muted-foreground hover:text-foreground">
          {t("auth.no_account")} <span className="underline">{t("auth.register")}</span>
        </button>
      </form>
    </Form>
  );
}
