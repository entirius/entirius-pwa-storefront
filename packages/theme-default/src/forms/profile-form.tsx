// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ProfileFormModel } from "@entirius/storefront-sdk/forms";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";
import { Form, FormError } from "@theme/ui/form";
import { TextField } from "@theme/ui/form-fields";
import { Spinner } from "@theme/ui/spinner";

// The customer's name, edited in place on the account overview.
export function ProfileForm({ form, submit, pending, cancel }: ProfileFormModel) {
  const { t } = useI18n();
  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField control={form.control} name="firstname" label={t("address.firstname")} autoComplete="given-name" />
        <TextField control={form.control} name="lastname" label={t("address.lastname")} autoComplete="family-name" />
        <FormError>{form.formState.errors.root?.message}</FormError>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner className="size-4" /> : t("common.save")}
          </Button>
          <Button type="button" variant="ghost" onClick={cancel}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
