// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { LayoutGrid, LogOut, MapPin, Package } from "lucide-react";

import { cn } from "@/lib/utils";
import { client_logout } from "@/lib/auth-client";
import { clear_cart_on_logout } from "@/stores/cart-login";
import { useAuth } from "@/providers/auth.provider";
import { LinkDynamic } from "@/lib/link-dynamic";
import type { MessageKey } from "@/lib/i18n/translate";
import { useI18n } from "@/providers/i18n.provider";

const ITEMS: { href: string; label: MessageKey; icon: typeof LayoutGrid; exact: boolean }[] = [
  { href: "/profile", label: "profile.overview", icon: LayoutGrid, exact: true },
  { href: "/profile/orders", label: "profile.orders", icon: Package, exact: false },
  { href: "/profile/addresses", label: "profile.addresses", icon: MapPin, exact: false },
];

// Side menu of the account section; a row of pills on phones.
export function AccountMenu() {
  const { setLoggedIn } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname() ?? "";
  // Paths may carry the country prefix (/pl/profile/orders).
  const path = pathname.replace(/^\/[a-z]{2}(?=\/profile)/, "");

  const logout = () => {
    client_logout();
    clear_cart_on_logout();
    setLoggedIn(false);
    const country = params?.customer_country as string | undefined;
    router.push(!country || country === "default" ? "/" : `/${country}`);
  };

  const item_class = (active: boolean) =>
    cn(
      "flex min-h-11 shrink-0 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition-colors",
      active ? "bg-accent text-accent-foreground" : "text-heading hover:bg-muted",
    );

  return (
    <nav
      aria-label={t("header.account")}
      className="flex gap-1 overflow-x-auto rounded-3xl bg-card p-2 md:flex-col md:overflow-visible"
    >
      {ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? path === href : path.startsWith(href);
        return (
          <LinkDynamic
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={item_class(active)}
          >
            <Icon className="size-4" aria-hidden />
            {t(label)}
          </LinkDynamic>
        );
      })}
      <button type="button" onClick={logout} className={cn(item_class(false), "cursor-pointer md:mt-2")}>
        <LogOut className="size-4" aria-hidden />
        {t("profile.log_out")}
      </button>
    </nav>
  );
}
