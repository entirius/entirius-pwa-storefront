// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useState } from "react";
import { BookUser, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n.provider";
import type { CustomerAddress } from "@/app/[customer_country]/profile/addresses/api.query";

// Value of the "new address" row; address ids come from the backend and never take it.
export const NEW_ADDRESS = "new";

// The address book above an address block: one line in the form (the entry the block holds, or a call to
// choose one) that opens the book in a sheet, so a long book never stretches the step. Picking an entry
// fills the block and closes the sheet; "New address" empties the block. `selected` is the entry the block
// holds right now (matching_address), so editing a field moves the choice to "New address" on its own.
export function SavedAddressPicker({
  addresses,
  default_id,
  selected,
  onPick,
}: {
  addresses: CustomerAddress[];
  default_id?: string | null;
  selected: string | null;
  onPick: (id: string) => void;
}) {
  const { t, country } = useI18n();
  const [open, setOpen] = useState(false);
  const value = selected ?? NEW_ADDRESS;
  const current = addresses.find((a) => a.address_id === selected);

  const row = (active: boolean) =>
    cn(
      "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
      active ? "border-primary bg-primary/5" : "hover:bg-muted/50",
    );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-saved-addresses-trigger
          className="h-auto min-h-9 w-full justify-start gap-3 py-2 text-left font-normal"
        >
          <BookUser className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            {current
              ? `${current.firstname} ${current.lastname}, ${current.street}, ${current.postcode} ${current.city}`
              : t("checkout.choose_saved_address")}
          </span>
          {current && <span className="shrink-0 text-xs font-medium text-primary">{t("checkout.change_address")}</span>}
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" aria-describedby={undefined} className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("profile.saved_addresses")}</SheetTitle>
        </SheetHeader>
        <RadioGroup
          aria-label={t("profile.saved_addresses")}
          value={value}
          onValueChange={(id) => {
            onPick(id);
            setOpen(false);
          }}
          className="gap-3 px-4 pb-4"
          data-saved-addresses
        >
          {addresses.map((a) => (
            <label key={a.address_id} className={row(value === a.address_id)}>
              <RadioGroupItem value={a.address_id} className="mt-0.5" />
              <span className="flex min-w-0 flex-col gap-0.5 text-sm">
                <span className="font-medium">
                  {a.firstname} {a.lastname}
                  {a.address_id === default_id && (
                    <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-xs font-normal text-accent-foreground">
                      {t("profile.default")}
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground">
                  {a.street}, {a.postcode} {a.city}, {country(a.country_code)}
                </span>
                <span className="text-muted-foreground">
                  {a.dialling_code} {a.telephone}
                </span>
                {a.is_company && a.company && (
                  <span className="text-muted-foreground">
                    {a.company} · {t("address.tax_id_line", { value: a.tax_id ?? "" })}
                  </span>
                )}
              </span>
            </label>
          ))}
          <label className={row(value === NEW_ADDRESS)}>
            <RadioGroupItem value={NEW_ADDRESS} className="mt-0.5" />
            <span className="text-sm font-medium">{t("checkout.new_address")}</span>
          </label>
        </RadioGroup>
      </SheetContent>
    </Sheet>
  );
}
