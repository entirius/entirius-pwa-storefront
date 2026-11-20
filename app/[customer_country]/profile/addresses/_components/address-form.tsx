// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { AddressForm } from "@theme/forms/address-form";
import type { AddressFormValues } from "@entirius/storefront-sdk/forms";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  customer_address_schema,
  to_customer_address_body,
  type CustomerAddressFormValues,
} from "@/utils/validation/customer-address.schema";
import { postcode_example } from "@/utils/validation/address-rules";
import { useCountryOptions } from "@/utils/checkout-countries";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

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
  const form = useForm<AddressFormValues>({
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
    <AddressForm
      form={form}
      submit={submit}
      pending={pending}
      open={open}
      set_open={onOpenChange}
      title={title}
      countries={countries.map((c) => ({ value: c.code, label: c.label }))}
      dialling={dialling.map((d) => ({ value: d, label: d }))}
      select_country={(code) => {
        const opt = countries.find((c) => c.code === code);
        if (opt) form.setValue("dialling_code", opt.dialling_code);
      }}
      company={!!is_company}
      postcode_hint={postcode_sample || null}
    />
  );
}
