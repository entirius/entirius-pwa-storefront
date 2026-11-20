// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { AddressFormModel } from "@entirius/storefront-sdk/forms";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";
import { Form, FormError, PHONE_ROW } from "@theme/ui/form";
import { CheckboxField, SelectField, TextField } from "@theme/ui/form-fields";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@theme/ui/sheet";
import { Spinner } from "@theme/ui/spinner";

// The address book's sheet: name, street, postcode and city, country, phone, and the company fields when asked for.
export function AddressForm({
  form,
  submit,
  pending,
  open,
  set_open,
  title,
  countries,
  dialling,
  select_country,
  company,
  postcode_hint,
}: AddressFormModel) {
  const { t } = useI18n();
  return (
    <Sheet open={open} onOpenChange={set_open}>
      <SheetContent side="right" aria-describedby={undefined} className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={submit} className="flex flex-col gap-4 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={form.control} name="firstname" label={t("address.firstname")} autoComplete="given-name" />
              <TextField control={form.control} name="lastname" label={t("address.lastname")} autoComplete="family-name" />
            </div>
            <TextField control={form.control} name="street" label={t("address.street")} autoComplete="street-address" />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="postcode"
                label={t("address.postcode")}
                hint={postcode_hint ? t("address.postcode_example", { example: postcode_hint }) : undefined}
                autoComplete="postal-code"
              />
              <TextField control={form.control} name="city" label={t("address.city")} autoComplete="address-level2" />
            </div>
            <SelectField
              control={form.control}
              name="country_code"
              label={t("address.country")}
              options={countries}
              onSelect={select_country}
            />
            <div className={PHONE_ROW}>
              <SelectField control={form.control} name="dialling_code" label={t("address.dialling_code")} options={dialling} />
              <TextField control={form.control} name="telephone" label={t("address.phone")} type="tel" autoComplete="tel-national" />
            </div>
            <CheckboxField control={form.control} name="is_company" label={t("profile.company_address")} />
            {company && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField control={form.control} name="company" label={t("address.company")} autoComplete="organization" />
                <TextField control={form.control} name="tax_id" label={t("address.tax_id")} />
              </div>
            )}
            <FormError>{form.formState.errors.root?.message}</FormError>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner className="size-4" /> : t("profile.save_address")}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
