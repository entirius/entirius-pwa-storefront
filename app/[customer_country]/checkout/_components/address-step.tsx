// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useMemo, useRef, useTransition } from "react";
import { useForm, useWatch, type Control, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";

import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import { API_CART_ADDRESS_ROUTE } from "@/API/api.routes";
import { DEBUG_MODE } from "@/_CONFIG/app.config.json";
import {
  address_schema,
  empty_address_defaults,
  dummy_address_defaults,
  to_addresses_body,
  type AddressFormValues,
} from "@/utils/validation/address.schema";
import {
  Form,
  FormError,
  FormSection,
  PHONE_ROW,
} from "@/components/ui/form";
import { CheckboxField, SelectField, TextField } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCountryOptions } from "@/utils/checkout-countries";
import { postcode_example } from "@/utils/validation/address-rules";
import { useI18n } from "@/providers/i18n.provider";
import { useAuth } from "@/providers/auth.provider";
import {
  addresses_query,
  defaults_query,
  type CustomerAddress,
} from "@/app/[customer_country]/profile/addresses/api.query";
import { profile_query } from "@/app/[customer_country]/profile/api.query";
import { NEW_ADDRESS, SavedAddressPicker } from "./saved-address-picker";
import {
  book_block,
  book_invoice,
  book_to_address_form,
  matching_address,
} from "./saved-addresses";

type Form = ReturnType<typeof useForm<AddressFormValues>>;

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
  const { t } = useI18n();
  const access = useMemo(() => make_client_access(), []);
  const api = useMemo(() => create_api(access), [access]);
  const [pending, startTransition] = useTransition();

  const form = useForm<AddressFormValues>({
    // Same nominal zod type-brand cast as the auth forms (duplicate zod@4 in the tree).
    resolver: zodResolver(address_schema as never),
    mode: "onBlur",
    defaultValues: empty_address_defaults,
  });

  // A signed-in customer's address book: picked from above each block, and the proposal for an empty cart.
  const { isLoggedIn } = useAuth();
  const { data: addresses } = useQuery({ ...addresses_query(), enabled: isLoggedIn });
  const { data: defaults } = useQuery({ ...defaults_query(), enabled: isLoggedIn });
  const { data: profile } = useQuery({ ...profile_query(), enabled: isLoggedIn });
  // undefined while the book loads, null for a guest.
  const book = useMemo(() => {
    if (!isLoggedIn) return null;
    if (!addresses || !defaults || profile === undefined) return undefined;
    return book_to_address_form(addresses, defaults, profile?.email ?? "");
  }, [isLoggedIn, addresses, defaults, profile]);

  // Hydrate once — from the saved cart address, else (cart known to have none) from the address book — but
  // never clobber in-progress edits.
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current || form.formState.isDirty) return;
    const values = initial ?? (cartReady ? book : undefined);
    if (!values) return;
    hydrated.current = true;
    form.reset(values);
  }, [initial, cartReady, book, form]);

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
            message: t("checkout.address_failed"),
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
          <div className="flex flex-col gap-2 rounded-md border border-notice/50 bg-notice-surface p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="rounded bg-notice-surface px-1.5 py-0.5 font-semibold tracking-wide text-notice uppercase">
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
            <p className="text-notice/80">
              These tools are only visible because DEBUG_MODE is on.
            </p>
          </div>
        )}

        <FormSection title={t("checkout.billing_details")}>
          <TextField
            control={form.control}
            name="billing.email"
            label={t("address.email")}
            hint={t("checkout.email_hint")}
            type="email"
            autoComplete="email"
          />
          <BookPicker form={form} prefix="billing" addresses={addresses} default_id={defaults?.billing_address} />
          <AddressFields control={form.control} prefix="billing" form={form} />
        </FormSection>

        <CheckboxField control={form.control} name="requested_invoice" label={t("checkout.request_invoice")} />
        {requested_invoice && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="company" label={t("address.company")} />
            <TextField control={form.control} name="tax_id" label={t("address.tax_id")} />
          </div>
        )}

        <CheckboxField control={form.control} name="ship_to_different" label={t("checkout.ship_to_different")} />
        {ship_to_different && (
          <FormSection title={t("checkout.shipping_address")}>
            <BookPicker form={form} prefix="shipping" addresses={addresses} default_id={defaults?.shipping_address} />
            <AddressFields control={form.control} prefix="shipping" form={form} />
          </FormSection>
        )}

        <FormError>{form.formState.errors.root?.message}</FormError>

        {!cartReady && (
          <p className="text-xs text-muted-foreground">{t("checkout.preparing")}</p>
        )}
        <Button type="submit" disabled={pending || !cartReady} className="w-full sm:w-auto">
          {pending ? <Spinner className="size-4" /> : t("checkout.to_shipping")}
        </Button>
      </form>
    </Form>
  );
}

// Address-book entries above a block (signed in, at least one saved). Picking one fills the block — on billing
// with its invoice data too; "New address" empties it for typing.
function BookPicker({
  form,
  prefix,
  addresses,
  default_id,
}: {
  form: Form;
  prefix: "billing" | "shipping";
  addresses: CustomerAddress[] | undefined;
  default_id?: string | null;
}) {
  const block = useWatch({ control: form.control, name: prefix });
  if (!addresses?.length) return null;

  const set = (path: string, value: unknown) =>
    form.setValue(path as Path<AddressFormValues>, value as never, { shouldDirty: true });

  // The whole block is set first and validated once: the postal code and phone rules read the country and
  // dialling code, which a field-by-field validation would still see as the previous ones.
  const onPick = (id: string) => {
    const entry = id === NEW_ADDRESS ? undefined : addresses.find((a) => a.address_id === id);
    if (!entry) {
      // A new address keeps the country and its dialling code; the rest is typed in.
      const paths = ["firstname", "lastname", "street", "city", "postcode", "telephone"].map((key) => `${prefix}.${key}`);
      for (const path of paths) set(path, "");
      form.clearErrors(paths as Path<AddressFormValues>[]);
      return;
    }
    const block = Object.entries(book_block(entry));
    for (const [key, value] of block) set(`${prefix}.${key}`, value);
    if (prefix === "billing")
      for (const [key, value] of Object.entries(book_invoice(entry))) set(key, value);
    void form.trigger(block.map(([key]) => `${prefix}.${key}`) as Path<AddressFormValues>[]);
  };

  return (
    <SavedAddressPicker
      addresses={addresses}
      default_id={default_id}
      selected={matching_address(block, addresses)}
      onPick={onPick}
    />
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
  form: Form;
}) {
  const { t } = useI18n();
  const { options: countries, dialling, default_code, ready } = useCountryOptions();
  // A country the channel does not accept (the form default, an old cart address) gives way to its default.
  const current = form.watch(`${prefix}.country_code` as Path<AddressFormValues>) as string;
  const postcode_sample = postcode_example(current ?? "");
  useEffect(() => {
    if (!ready || countries.some((c) => c.code === current)) return;
    const fallback = countries.find((c) => c.code === default_code) ?? countries[0];
    form.setValue(`${prefix}.country_code` as Path<AddressFormValues>, fallback.code);
    form.setValue(`${prefix}.dialling_code` as Path<AddressFormValues>, fallback.dialling_code);
  }, [ready, countries, current, default_code, form, prefix]);
  const onCountry = (code: string) => {
    const opt = countries.find((c) => c.code === code);
    if (opt)
      form.setValue(
        `${prefix}.dialling_code` as Path<AddressFormValues>,
        opt.dialling_code,
      );
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={control} name={`${prefix}.firstname` as Path<AddressFormValues>} label={t("address.firstname")} autoComplete="given-name" />
        <TextField control={control} name={`${prefix}.lastname` as Path<AddressFormValues>} label={t("address.lastname")} autoComplete="family-name" />
      </div>
      <TextField control={control} name={`${prefix}.street` as Path<AddressFormValues>} label={t("address.street")} autoComplete="street-address" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          control={control}
          name={`${prefix}.postcode` as Path<AddressFormValues>}
          label={t("address.postcode")}
          hint={postcode_sample ? t("address.postcode_example", { example: postcode_sample }) : undefined}
          autoComplete="postal-code"
        />
        <TextField control={control} name={`${prefix}.city` as Path<AddressFormValues>} label={t("address.city")} autoComplete="address-level2" />
      </div>
      <SelectField
        control={control}
        name={`${prefix}.country_code` as Path<AddressFormValues>}
        label={t("address.country")}
        options={countries.map((c) => ({ value: c.code, label: c.label }))}
        onSelect={onCountry}
      />
      <div className={PHONE_ROW}>
        <SelectField
          control={control}
          name={`${prefix}.dialling_code` as Path<AddressFormValues>}
          label={t("address.dialling_code")}
          options={dialling.map((d) => ({ value: d, label: d }))}
        />
        <TextField control={control} name={`${prefix}.telephone` as Path<AddressFormValues>} label={t("address.phone")} hint={t("checkout.phone_hint")} type="tel" autoComplete="tel-national" />
      </div>
    </>
  );
}
