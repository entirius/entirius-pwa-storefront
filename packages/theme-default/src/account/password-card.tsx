// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useAccountOverview } from "@entirius/storefront-sdk/account/page";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";

// The password: Change opens the core's form in place; a note once it is changed.
export function PasswordCard() {
  const { t } = useI18n();
  const { password } = useAccountOverview();
  return (
    <section aria-labelledby="password" className="surface flex flex-col gap-4">
      <h2 id="password" className="text-xl">
        {t("profile.password")}
      </h2>
      {password.editing ? (
        password.form
      ) : (
        <>
          {password.changed && (
            <p role="status" className="text-sm text-muted-foreground">
              {t("profile.password_changed")}
            </p>
          )}
          <Button variant="outline" size="sm" className="self-start" onClick={password.edit}>
            {t("profile.change_password")}
          </Button>
        </>
      )}
    </section>
  );
}
