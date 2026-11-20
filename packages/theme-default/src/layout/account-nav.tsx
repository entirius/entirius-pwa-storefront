// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { User } from "lucide-react";

import { Link } from "@entirius/storefront-sdk/components/link";
import { useAccount } from "@entirius/storefront-sdk/storefront";
import { Button } from "@theme/ui/button";
import { AccountSheet } from "@theme/layout/account-sheet";
import { HEADER_ICON } from "@theme/layout/header-icon";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

// Logged in → the User icon links to the /profile hub. Logged out → it opens the
// login/register Sheet. Auth state comes from the shared AuthProvider context.
export function AccountNav() {
  const { logged_in } = useAccount();
  const { t } = useI18n();

  if (logged_in) {
    return (
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="relative cursor-pointer text-foreground"
      >
        <Link href="/profile" aria-label={t("header.account")}>
          <User className={HEADER_ICON} />
        </Link>
      </Button>
    );
  }

  return <AccountSheet />;
}
