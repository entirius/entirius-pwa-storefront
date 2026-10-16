// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useHydrated } from "@/lib/use-hydrated";
import { ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LinkDynamic } from "@/lib/link-dynamic";
import { CountBadge } from "./count-badge";
import { useCartStore } from "@/stores/cart.store";
import { useI18n } from "@/providers/i18n.provider";

// Header cart icon: a link to the cart page with the item count.
export function CartLink() {
  const count = useCartStore((s) => s.count());
  const pathname = usePathname() ?? "";
  const mounted = useHydrated();
  const { t } = useI18n();
  const on_cart = /\/cart$/.test(pathname);

  return (
    <LinkDynamic
      href="/cart"
      aria-current={on_cart ? "page" : undefined}
      // The count joins the name only after mount, like the badge (no hydration mismatch).
      aria-label={
        mounted && count > 0 ? t("cart.link_label", { count }) : t("header.cart")
      }
      className={cn(
        "relative inline-flex size-9 touch-target items-center justify-center rounded-control text-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&_svg]:size-4",
        on_cart && "bg-accent text-accent-foreground",
      )}
    >
      <ShoppingBag />
      <CountBadge count={count} mounted={mounted} />
    </LinkDynamic>
  );
}
