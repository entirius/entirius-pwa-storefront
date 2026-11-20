// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useAccountOverview } from "@entirius/storefront-sdk/account/page";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Spinner } from "@theme/ui/spinner";
import { LatestOrder } from "@theme/account/latest-order";
import { AccountDetails } from "@theme/account/account-details";
import { DefaultAddress } from "@theme/account/default-address";
import { PasswordCard } from "@theme/account/password-card";

// The account's overview: the latest order across the page, then details, the default address and the password.
export function OverviewPage() {
  const { t } = useI18n();
  const { details } = useAccountOverview();
  if (!details) {
    return (
      <div className="py-8">
        <Spinner className="size-5" />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl">{t("profile.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("profile.intro")}</p>
      </div>
      <LatestOrder />
      <div className="grid gap-6 lg:grid-cols-2">
        <AccountDetails />
        <DefaultAddress />
        <PasswordCard />
      </div>
    </div>
  );
}
