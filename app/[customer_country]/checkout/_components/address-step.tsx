"use client";

import { useEffect, useMemo, useRef, useTransition } from "react";
import { useForm, type Control, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import { API_CART_ADDRESS_ROUTE } from "@/API/api.routes";
import { DEBUG_MODE } from "@/_CONFIG/app.config.json";
import {
  address_schema,
  empty_address_defaults,
  dummy_address_defaults,
  to_addresses_body,
  COUNTRY_OPTIONS,
  DIALLING_OPTIONS,
  type AddressFormValues,
} from "@/utils/validation/address.schema";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";

// Backend validation field ("billing_address.email") → RHF form path ("billing.email").
// company/tax_id live at the form root (sent inside billing_address only when invoiced).
function to_form_path(field: string): Path<AddressFormValues> | "root" {
  if (field.startsWith("billing_address.")) {
    const f = field.slice("billing_address.".length);
    if (f === "company" || f === "tax_id") return f as Path<AddressFormValues>;
    return `billing.${f}` as Path<AddressFormValues>;
  }
  if (field.startsWith("shipping_address."))
    return `shipping.${field.slice("shipping_address.".length)}` as Path<AddressFormValues>;
  return "root";
}

export function AddressStep({
  cartReady,
  initial,
  onSaved,
}: {
  cartReady: boolean;
  // Address values already stored on the cart (from a reload / revisit); used to
  // pre-fill the form instead of showing blanks. null when the cart has none yet.
  initial?: AddressFormValues | null;
  onSaved: (cart: unknown) => void;
}) {
  const access = useMemo(() => make_client_access(), []);
  const api = useMemo(() => create_api(access), [access]);
  const [pending, startTransition] = useTransition();

  const form = useForm<AddressFormValues>({
    // Same nominal zod type-brand cast as the auth forms (duplicate zod@4 in the tree).
    resolver: zodResolver(address_schema as never),
    mode: "onBlur",
    defaultValues: empty_address_defaults,
  });

  // Hydrate once from the saved cart address, but never clobber in-progress edits.
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current || !initial || form.formState.isDirty) return;
    hydrated.current = true;
    form.reset(initial);
  }, [initial, form]);

  const requested_invoice = form.watch("requested_invoice");
  const ship_to_different = form.watch("ship_to_different");

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      const [error, response] = await api.FETCH_METHOD(API_CART_ADDRESS_ROUTE, {
        method: "PATCH",
        body: JSON.stringify(to_addresses_body(values)),
      });
      if (error) {
        const details = (error as { body?: { details?: unknown } })?.body?.details;
        if (Array.isArray(details) && details.length) {
          for (const d of details as { field: string; message: string }[]) {
            const path = to_form_path(d.field);
            if (path === "root") form.setError("root", { message: d.message });
            else form.setError(path, { message: d.message });
          }
        } else {
          form.setError("root", {
            message: error.message || "Couldn’t save your address.",
          });
        }
        return;
      }
      onSaved(response);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex flex-col gap-6">
        {DEBUG_MODE && (
          <div className="flex flex-col gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-400">
                dev
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => form.reset(dummy_address_defaults)}
              >
                Fill test data
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => form.reset(empty_address_defaults)}
              >
                Clear
              </Button>
            </div>
            <p className="text-amber-700/80 dark:text-amber-400/80">
              These tools are only visible because DEBUG_MODE is on.
            </p>
          </div>
        )}

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-sm font-semibold text-muted-foreground">
            Billing details
          </legend>
          <TextField
            control={form.control}
            name="billing.email"
            label="Email"
            type="email"
            autoComplete="email"
          />
          <AddressFields control={form.control} prefix="billing" form={form} />
        </fieldset>

        <FormField
          control={form.control}
          name="requested_invoice"
          render={({ field }) => (
            <FormItem>
              <label className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <span className="text-sm">Request a VAT invoice</span>
              </label>
            </FormItem>
          )}
        />
        {requested_invoice && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="company" label="Company" />
            <TextField control={form.control} name="tax_id" label="Tax ID" />
          </div>
        )}

        <FormField
          control={form.control}
          name="ship_to_different"
          render={({ field }) => (
            <FormItem>
              <label className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <span className="text-sm">Ship to a different address</span>
              </label>
            </FormItem>
          )}
        />
        {ship_to_different && (
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 text-sm font-semibold text-muted-foreground">
              Shipping address
            </legend>
            <AddressFields control={form.control} prefix="shipping" form={form} />
          </fieldset>
        )}

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        {!cartReady && (
          <p className="text-xs text-muted-foreground">Preparing your cart…</p>
        )}
        <Button type="submit" disabled={pending || !cartReady} className="w-full sm:w-auto">
          {pending ? <Spinner className="size-4" /> : "Continue to shipping"}
        </Button>
      </form>
    </Form>
  );
}

// The 8 address fields shared by billing + shipping. Selecting a country pre-fills
// its dialling code (users can still override it).
function AddressFields({
  control,
  prefix,
  form,
}: {
  control: Control<AddressFormValues>;
  prefix: "billing" | "shipping";
  form: ReturnType<typeof useForm<AddressFormValues>>;
}) {
  const onCountry = (code: string) => {
    const opt = COUNTRY_OPTIONS.find((c) => c.code === code);
    if (opt)
      form.setValue(
        `${prefix}.dialling_code` as Path<AddressFormValues>,
        opt.dialling_code,
      );
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={control} name={`${prefix}.firstname` as Path<AddressFormValues>} label="First name" autoComplete="given-name" />
        <TextField control={control} name={`${prefix}.lastname` as Path<AddressFormValues>} label="Last name" autoComplete="family-name" />
      </div>
      <TextField control={control} name={`${prefix}.street` as Path<AddressFormValues>} label="Street and number" autoComplete="street-address" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={control} name={`${prefix}.postcode` as Path<AddressFormValues>} label="Postal code" autoComplete="postal-code" />
        <TextField control={control} name={`${prefix}.city` as Path<AddressFormValues>} label="City" autoComplete="address-level2" />
      </div>
      <SelectField
        control={control}
        name={`${prefix}.country_code` as Path<AddressFormValues>}
        label="Country"
        options={COUNTRY_OPTIONS.map((c) => ({ value: c.code, label: c.name }))}
        onSelect={onCountry}
      />
      <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
        <SelectField
          control={control}
          name={`${prefix}.dialling_code` as Path<AddressFormValues>}
          label="Code"
          options={DIALLING_OPTIONS.map((d) => ({ value: d, label: d }))}
        />
        <TextField control={control} name={`${prefix}.telephone` as Path<AddressFormValues>} label="Phone number" type="tel" autoComplete="tel-national" />
      </div>
    </>
  );
}

function TextField({
  control,
  name,
  label,
  type = "text",
  autoComplete,
}: {
  control: Control<AddressFormValues>;
  name: Path<AddressFormValues>;
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
  control: Control<AddressFormValues>;
  name: Path<AddressFormValues>;
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
