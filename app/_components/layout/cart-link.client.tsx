// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useHydrated } from "@/lib/use-hydrated";
import { ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LinkDynamic } from "@/lib/link-dynamic";
import { Spinner } from "@/components/ui/spinner";
import { useCartStore } from "@/stores/cart.store";

// Header cart icon: a link to the cart page with the item count.
export function CartLink() {
  const count = useCartStore((s) => s.count());
  const pathname = usePathname() ?? "";
  const mounted = useHydrated();
  const on_cart = /\/cart$/.test(pathname);

  return (
    <LinkDynamic
      href="/cart"
      aria-current={on_cart ? "page" : undefined}
      // The count joins the name only after mount, like the badge (no hydration mismatch).
      aria-label={
        mounted && count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"
      }
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&_svg]:size-4",
        on_cart && "bg-accent text-accent-foreground",
      )}
    >
      <ShoppingBag />
      {!mounted ? (
        <Spinner className="absolute -top-1 -right-1 size-3" />
      ) : count > 0 ? (
        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {count}
        </span>
      ) : null}
    </LinkDynamic>
  );
}
