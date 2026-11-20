// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useAccountOverview } from "@entirius/storefront-sdk/account/page";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";

// The customer's name and e-mail; Edit opens the core's form in place.
export function AccountDetails() {
  const { t } = useI18n();
  const { details } = useAccountOverview();
  if (!details) return null;
  return (
    <section aria-labelledby="account-details" className="surface flex flex-col gap-4">
      <h2 id="account-details" className="text-xl">
        {t("profile.account_details")}
      </h2>
      {details.editing ? (
        details.form
      ) : (
        <>
          <div className="flex flex-col gap-1">
            {details.name && <p className="text-lg font-medium text-heading">{details.name}</p>}
            <p className="text-sm text-muted-foreground">{details.email ?? "—"}</p>
          </div>
          <Button variant="outline" size="sm" className="self-start" onClick={details.edit}>
            {t("common.edit")}
          </Button>
        </>
      )}
    </section>
  );
}
