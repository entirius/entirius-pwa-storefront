// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AddressesPageProvider, type AddressesPageModel } from "@entirius/storefront-sdk/account/page";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { customer_address_lines } from "@/lib/account-models";
import { empty_customer_address, type CustomerAddressFormValues } from "@/utils/validation/customer-address.schema";
import {
  addresses_query,
  defaults_query,
  add_address,
  update_address,
  remove_address,
  set_defaults,
  type CustomerAddress,
} from "../api.query";
import { AddressFormSheet } from "./address-form";

function to_form_values(a: CustomerAddress): CustomerAddressFormValues {
  return {
    firstname: a.firstname,
    lastname: a.lastname,
    street: a.street,
    city: a.city,
    postcode: a.postcode,
    country_code: a.country_code,
    dialling_code: a.dialling_code,
    telephone: a.telephone,
    is_company: a.is_company,
    company: a.company ?? "",
    tax_id: a.tax_id ?? "",
  };
}

// The address book's model for the theme's template (@theme/account/addresses-page): the saved addresses with
// their actions, and the add / edit sheet.
export function AddressesRuntime({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { data: addresses, isLoading } = useQuery(addresses_query());
  const { data: defaults } = useQuery(defaults_query());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["addresses"] });
    queryClient.invalidateQueries({ queryKey: ["address-defaults"] });
  };
  const submit = async (body: Parameters<typeof add_address>[0]): Promise<void> => {
    if (editing) await update_address(editing.address_id, body);
    else await add_address(body);
    invalidate();
  };
  const is_default = (id: string) => defaults?.billing_address === id || defaults?.shipping_address === id;

  const model: AddressesPageModel = {
    status: isLoading ? "loading" : "ready",
    addresses: (addresses ?? []).map((address) => ({
      id: address.address_id,
      lines: customer_address_lines(address),
      is_default: is_default(address.address_id),
      set_default: async () => {
        await set_defaults({ billing_address: address.address_id, shipping_address: address.address_id });
        invalidate();
      },
      edit: () => {
        setEditing(address);
        setOpen(true);
      },
      remove: async () => {
        if (!window.confirm(t("profile.confirm_delete"))) return;
        await remove_address(address.address_id);
        invalidate();
      },
    })),
    add: () => {
      setEditing(null);
      setOpen(true);
    },
    form: (
      <AddressFormSheet
        open={open}
        onOpenChange={setOpen}
        title={editing ? t("profile.edit_address") : t("profile.add_address")}
        initial={editing ? to_form_values(editing) : empty_customer_address}
        onSubmit={submit}
      />
    ),
  };

  return <AddressesPageProvider value={model}>{children}</AddressesPageProvider>;
}
