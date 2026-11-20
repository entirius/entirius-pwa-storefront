// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useAccountOverview } from "@entirius/storefront-sdk/account/page";
import { Link } from "@entirius/storefront-sdk/components/link";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Spinner } from "@theme/ui/spinner";
import { AddressLines } from "@theme/account/address-lines";

// The default delivery address (else the first saved one) and the way to the address book.
export function DefaultAddress() {
  const { t } = useI18n();
  const { address } = useAccountOverview();
  return (
    <section aria-labelledby="default-address" className="surface flex flex-col gap-4">
      <h2 id="default-address" className="text-xl">
        {t("profile.default_address")}
      </h2>
      {!address ? (
        <Spinner className="size-5" />
      ) : address.lines ? (
        <AddressLines lines={address.lines} />
      ) : (
        <p className="text-sm text-muted-foreground">{t("profile.no_saved_addresses")}</p>
      )}
      <Link href="/profile/addresses" className="link mt-auto text-sm font-semibold">
        {t("profile.manage_addresses")}
        {address?.count ? ` (${address.count})` : ""}
      </Link>
    </section>
  );
}
