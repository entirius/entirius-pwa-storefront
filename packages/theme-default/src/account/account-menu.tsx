// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { LayoutGrid, LogOut, MapPin, Package } from "lucide-react";
import { useAccountMenu } from "@entirius/storefront-sdk/account/page";
import { Link } from "@entirius/storefront-sdk/components/link";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { cn } from "@theme/lib/utils";

const ICONS = { overview: LayoutGrid, orders: Package, addresses: MapPin };

const item_class = (active: boolean) =>
  cn(
    "flex min-h-touch shrink-0 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition-colors",
    active ? "bg-accent text-accent-foreground" : "text-heading hover:bg-muted",
  );

// The account's pages and logging out.
export function AccountMenu() {
  const { t } = useI18n();
  const { items, log_out } = useAccountMenu();
  return (
    <nav aria-label={t("header.account")} className="flex gap-1 overflow-x-auto surface-sm md:flex-col md:overflow-visible">
      {items.map(({ id, href, label, current }) => {
        const Icon = ICONS[id];
        return (
          <Link key={id} href={href} aria-current={current ? "page" : undefined} className={item_class(current)}>
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
      <button type="button" onClick={log_out} className={cn(item_class(false), "cursor-pointer md:mt-2")}>
        <LogOut className="size-4" aria-hidden />
        {t("profile.log_out")}
      </button>
    </nav>
  );
}
