// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useAddressesPage } from "@entirius/storefront-sdk/account/page";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";
import { Spinner } from "@theme/ui/spinner";
import { PageHeading } from "@theme/account/page-heading";
import { AddressCard } from "@theme/account/address-card";

// The address book: the saved addresses, adding one; the form is the core's sheet.
export function AddressesPage() {
  const { t } = useI18n();
  const { status, addresses, add, form } = useAddressesPage();
  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <PageHeading back={{ href: "/profile", label: t("profile.back") }} title={t("profile.addresses")} />
        <Button size="sm" onClick={add}>
          {t("profile.add_address")}
        </Button>
      </div>
      {status === "loading" ? (
        <Spinner className="size-5" />
      ) : !addresses.length ? (
        <p className="text-sm text-muted-foreground">{t("profile.no_addresses")}</p>
      ) : (
        <ul aria-label={t("profile.saved_addresses")} className="flex flex-col gap-3">
          {addresses.map((address) => (
            <AddressCard key={address.id} address={address} />
          ))}
        </ul>
      )}
      {form}
    </div>
  );
}
