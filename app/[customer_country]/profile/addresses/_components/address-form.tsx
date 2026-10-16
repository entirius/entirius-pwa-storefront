// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useTransition } from "react";
import { useForm, useWatch, type Control, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  customer_address_schema,
  to_customer_address_body,
  type CustomerAddressFormValues,
} from "@/utils/validation/customer-address.schema";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormError,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
              <TextField control={form.control} name="postcode" label={t("address.postcode")} autoComplete="postal-code" />
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
            <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
              <SelectField
                control={form.control}
                name="dialling_code"
                label={t("address.dialling_code")}
                options={dialling.map((d) => ({ value: d, label: d }))}
              />
              <TextField control={form.control} name="telephone" label={t("address.phone")} type="tel" autoComplete="tel-national" />
            </div>

            <FormField
              control={form.control}
              name="is_company"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">{t("profile.company_address")}</FormLabel>
                  </div>
                </FormItem>
              )}
            />
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

function TextField({
  control,
  name,
  label,
  type = "text",
  autoComplete,
}: {
  control: Control<CustomerAddressFormValues>;
  name: Path<CustomerAddressFormValues>;
  label: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              autoComplete={autoComplete}
              {...field}
              value={(field.value as string) ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SelectField({
  control,
  name,
  label,
  options,
  onSelect,
}: {
  control: Control<CustomerAddressFormValues>;
  name: Path<CustomerAddressFormValues>;
  label: string;
  options: { value: string; label: string }[];
  onSelect?: (value: string) => void;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={(field.value as string) ?? ""}
            onValueChange={(v) => {
              field.onChange(v);
              onSelect?.(v);
            }}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
