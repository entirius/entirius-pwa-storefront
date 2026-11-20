// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, type ReactNode } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { AccountMenuProvider, type AccountMenuModel } from "@entirius/storefront-sdk/account/page";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { AccountLayout } from "@theme/account/account-layout";
import { useAuth } from "@/providers/auth.provider";
import { client_logout } from "@/lib/auth-client";
import { clear_cart_on_logout } from "@/stores/cart-login";
import { clear_wishlist_on_logout } from "@/stores/wishlist-sync";

const PAGES = [
  { id: "overview", href: "/profile", label: "profile.overview", exact: true },
  { id: "orders", href: "/profile/orders", label: "profile.orders", exact: false },
  { id: "addresses", href: "/profile/addresses", label: "profile.addresses", exact: false },
] as const;

// Auth guard for the whole /profile section. Auth state is seeded server-side (AuthProvider), so a logged-in hard
// load passes without a flash; a logged-out visitor (or a logout) is bounced home. The frame and the menu are the
// theme's (@theme/account/account-layout).
export default function ProfileLayout({ children }: { children: ReactNode }) {
  const { isLoggedIn, setLoggedIn } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  // Paths may carry the country prefix (/pl/profile/orders).
  const path = (usePathname() ?? "").replace(/^\/[a-z]{2}(?=\/profile)/, "");

  useEffect(() => {
    if (!isLoggedIn) router.replace("/");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  const menu: AccountMenuModel = {
    items: PAGES.map(({ id, href, label, exact }) => ({
      id,
      href,
      label: t(label),
      current: exact ? path === href : path.startsWith(href),
    })),
    log_out: async () => {
      await client_logout();
      clear_cart_on_logout();
      clear_wishlist_on_logout();
      setLoggedIn(false);
      const country = params?.customer_country as string | undefined;
      router.push(!country || country === "default" ? "/" : `/${country}`);
    },
  };

  return (
    <AccountMenuProvider value={menu}>
      <AccountLayout>{children}</AccountLayout>
    </AccountMenuProvider>
  );
}
