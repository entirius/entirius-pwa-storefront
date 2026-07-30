"use client";

import { useTransition } from "react";
import { useForm, useWatch, type Control, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  customer_address_schema,
  to_customer_address_body,
  COUNTRY_OPTIONS,
  DIALLING_OPTIONS,
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
        form.setError("root", { message: "Could not save the address. Please try again." });
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
              <TextField control={form.control} name="firstname" label="First name" autoComplete="given-name" />
              <TextField control={form.control} name="lastname" label="Last name" autoComplete="family-name" />
            </div>
            <TextField control={form.control} name="street" label="Street and number" autoComplete="street-address" />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={form.control} name="postcode" label="Postal code" autoComplete="postal-code" />
              <TextField control={form.control} name="city" label="City" autoComplete="address-level2" />
            </div>
            <SelectField
              control={form.control}
              name="country_code"
              label="Country"
              options={COUNTRY_OPTIONS.map((c) => ({ value: c.code, label: c.name }))}
              onSelect={(code) => {
                const opt = COUNTRY_OPTIONS.find((c) => c.code === code);
                if (opt) form.setValue("dialling_code", opt.dialling_code);
              }}
            />
            <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
              <SelectField
                control={form.control}
                name="dialling_code"
                label="Code"
                options={DIALLING_OPTIONS.map((d) => ({ value: d, label: d }))}
              />
              <TextField control={form.control} name="telephone" label="Phone number" type="tel" autoComplete="tel-national" />
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
                    <FormLabel className="text-sm font-normal">Company address (invoice)</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            {is_company && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField control={form.control} name="company" label="Company" autoComplete="organization" />
                <TextField control={form.control} name="tax_id" label="Tax ID" />
              </div>
            )}

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner className="size-4" /> : "Save address"}
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
