"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Pencil, Star, Trash2 } from "lucide-react";

import { LinkDynamic } from "@/lib/link-dynamic";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  addresses_query,
  defaults_query,
  add_address,
  update_address,
  remove_address,
  set_defaults,
  type CustomerAddress,
} from "../api.query";
import {
  empty_customer_address,
  type CustomerAddressFormValues,
} from "@/utils/validation/customer-address.schema";
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

export function AddressList() {
  const queryClient = useQueryClient();
  const { data: addresses, isLoading } = useQuery(addresses_query());
  const { data: defaults } = useQuery(defaults_query());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["addresses"] });
    queryClient.invalidateQueries({ queryKey: ["address-defaults"] });
  };

  const onSubmit = async (
    body: Parameters<typeof add_address>[0],
  ): Promise<void> => {
    if (editing) await update_address(editing.address_id, body);
    else await add_address(body);
    invalidate();
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Delete this address?")) return;
    await remove_address(id);
    invalidate();
  };

  const onSetDefault = async (id: string) => {
    await set_defaults({ billing_address: id, shipping_address: id });
    invalidate();
  };

  const isDefault = (id: string) =>
    defaults?.billing_address === id || defaults?.shipping_address === id;

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon">
            <LinkDynamic href="/profile" aria-label="Back to account">
              <ChevronLeft className="size-5" />
            </LinkDynamic>
          </Button>
          <h1 className="text-2xl font-bold">Delivery addresses</h1>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Add address
        </Button>
      </div>

      {isLoading ? (
        <Spinner className="size-5" />
      ) : !addresses?.length ? (
        <p className="text-sm text-muted-foreground">
          You have no saved addresses yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {addresses.map((a) => (
            <li
              key={a.address_id}
              className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
            >
              <div className="flex flex-col gap-0.5 text-sm">
                <span className="flex items-center gap-2 font-medium">
                  {a.firstname} {a.lastname}
                  {isDefault(a.address_id) && (
                    <span className="inline-flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
                      <Star className="size-3" /> Default
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground">{a.street}</span>
                <span className="text-muted-foreground">
                  {a.postcode} {a.city}, {a.country_code}
                </span>
                <span className="text-muted-foreground">
                  {a.dialling_code} {a.telephone}
                </span>
                {a.is_company && a.company && (
                  <span className="text-muted-foreground">
                    {a.company} · {a.tax_id}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {!isDefault(a.address_id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSetDefault(a.address_id)}
                  >
                    Set default
                  </Button>
                )}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit address"
                    onClick={() => {
                      setEditing(a);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete address"
                    onClick={() => onDelete(a.address_id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddressFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Edit address" : "Add address"}
        initial={editing ? to_form_values(editing) : empty_customer_address}
        onSubmit={onSubmit}
      />
    </div>
  );
}
