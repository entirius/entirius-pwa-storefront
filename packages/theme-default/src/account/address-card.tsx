// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Pencil, Star, Trash2 } from "lucide-react";
import type { AddressModel } from "@entirius/storefront-sdk/account/page";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";

// A saved address (a list item): its lines, the default mark, and setting it default, editing, deleting.
export function AddressCard({ address }: { address: AddressModel }) {
  const { t } = useI18n();
  const { lines } = address;
  return (
    <li className="surface-outline flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5 text-sm">
        <span className="flex items-center gap-2 font-medium">
          {lines.name}
          {address.is_default && (
            <span className="inline-flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
              <Star className="size-3" /> {t("profile.default")}
            </span>
          )}
        </span>
        <span className="text-muted-foreground">{lines.street}</span>
        <span className="text-muted-foreground">{lines.city}</span>
        {lines.phone && <span className="text-muted-foreground">{lines.phone}</span>}
        {lines.company && (
          <span className="text-muted-foreground">
            {lines.company} · {lines.tax_id}
          </span>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {!address.is_default && (
          <Button variant="ghost" size="sm" onClick={address.set_default}>
            {t("profile.set_default")}
          </Button>
        )}
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" aria-label={t("profile.edit_address")} onClick={address.edit}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t("profile.delete_address")} onClick={address.remove}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}
