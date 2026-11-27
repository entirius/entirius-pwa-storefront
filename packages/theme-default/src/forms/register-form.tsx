// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { RegisterFormModel } from "@entirius/storefront-sdk/forms";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { RichText } from "@entirius/storefront-sdk/components/rich-text";
import { Button } from "@theme/ui/button";
import { Form, FormError } from "@theme/ui/form";
import { CheckboxField, TextField } from "@theme/ui/form-fields";
import { Spinner } from "@theme/ui/spinner";

// A new account (the account sheet): e-mail, password twice, the consents, the newsletter box when the channel has
// one, and the way back to signing in.
export function RegisterForm({ form, submit, pending, newsletter, agreements, login }: RegisterFormModel) {
  const { t } = useI18n();
  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex flex-col gap-4 p-4">
        <TextField control={form.control} name="email" label={t("auth.email")} type="email" autoComplete="email" />
        <TextField control={form.control} name="password" label={t("auth.password")} hint={t("auth.password_hint")} type="password" autoComplete="new-password" />
        <TextField control={form.control} name="confirm_password" label={t("auth.confirm_password")} type="password" autoComplete="new-password" />
        {agreements ? (
          agreements.map((a) => (
            <CheckboxField
              key={a.slug}
              control={form.control}
              name={`accepted.${a.slug}`}
              label={<RichText as="span" html={a.html} new_tab_links="all" className="[&_a]:underline" />}
            />
          ))
        ) : (
          <>
            <CheckboxField control={form.control} name="consent_terms" label={t("auth.accept_terms")} />
            <CheckboxField control={form.control} name="consent_data" label={t("auth.consent_data")} />
            {newsletter && <CheckboxField control={form.control} name="newsletter" label={t("newsletter.signup_opt_in")} />}
          </>
        )}
        <FormError>{form.formState.errors.root?.message}</FormError>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner className="size-4" /> : t("auth.create_account")}
        </Button>
        <button type="button" onClick={login} className="text-sm text-muted-foreground hover:text-foreground">
          {t("auth.have_account")} <span className="underline">{t("auth.sign_in")}</span>
        </button>
      </form>
    </Form>
  );
}
