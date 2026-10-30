// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { User } from "lucide-react";

import { useAuth } from "@/providers/auth.provider";
import { LinkDynamic } from "@/lib/link-dynamic";
import { Button } from "@/components/ui/button";
import { AccountSheet } from "./account-sheet";
import { HEADER_ICON } from "./header-icon";
import { useI18n } from "@/providers/i18n.provider";

// Logged in → the User icon links to the /profile hub. Logged out → it opens the
// login/register Sheet. Auth state comes from the shared AuthProvider context.
export function AccountNav() {
  const { isLoggedIn } = useAuth();
  const { t } = useI18n();

  if (isLoggedIn) {
    return (
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="relative cursor-pointer text-foreground"
      >
        <LinkDynamic href="/profile" aria-label={t("header.account")}>
          <User className={HEADER_ICON} />
        </LinkDynamic>
      </Button>
    );
  }

  return <AccountSheet />;
}
