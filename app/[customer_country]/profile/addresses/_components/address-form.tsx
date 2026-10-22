// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  customer_address_schema,
  to_customer_address_body,
  type CustomerAddressFormValues,
} from "@/utils/validation/customer-address.schema";
import { postcode_example } from "@/utils/validation/address-rules";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormError,
  PHONE_ROW,
} from "@/components/ui/form";
import { CheckboxField, SelectField, TextField } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCountryOptions } from "@/utils/checkout-countries";
import { useI18n } from "@/providers/i18n.provider";

export function AddressFormSheet({
  open,
  onOpenChange,
  initial,
  title,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: CustomerAddressFormValues;
  title: string;
  onSubmit: (body: ReturnType<typeof to_customer_address_body>) => Promise<void>;
}) {
  const { t } = useI18n();
  const { options: countries, dialling } = useCountryOptions();
  const [pending, startTransition] = useTransition();
  const form = useForm<CustomerAddressFormValues>({
    resolver: zodResolver(customer_address_schema as never),
    mode: "onBlur",
    values: initial,
  });

  const is_company = useWatch({ control: form.control, name: "is_company" });
  const postcode_sample = postcode_example(useWatch({ control: form.control, name: "country_code" }) ?? "");

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await onSubmit(to_customer_address_body(values));
        onOpenChange(false);
      } catch {
        form.setError("root", { message: t("profile.address_failed") });
      }
    });
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
                hint={postcode_sample ? t("address.postcode_example", { example: postcode_sample }) : undefined}
                autoComplete="postal-code"
              />
              <TextField control={form.control} name="city" label={t("address.city")} autoComplete="address-level2" />
            </div>
            <SelectField
              control={form.control}
              name="country_code"
              label={t("address.country")}
              options={countries.map((c) => ({ value: c.code, label: c.label }))}
              onSelect={(code) => {
                const opt = countries.find((c) => c.code === code);
                if (opt) form.setValue("dialling_code", opt.dialling_code);
              }}
            />
            <div className={PHONE_ROW}>
              <SelectField
                control={form.control}
                name="dialling_code"
                label={t("address.dialling_code")}
                options={dialling.map((d) => ({ value: d, label: d }))}
              />
              <TextField control={form.control} name="telephone" label={t("address.phone")} type="tel" autoComplete="tel-national" />
            </div>

            <CheckboxField control={form.control} name="is_company" label={t("profile.company_address")} />
            {is_company && (
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
