// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useWishlistStore } from "@/stores/wishlist.store";
import { load_account_wishlist } from "@/stores/wishlist-sync";
import { useAuth } from "@/providers/auth.provider";
import { WishlistItems } from "./wishlist-items";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountBadge } from "./count-badge";
import { useHydrated } from "@/lib/use-hydrated";
import { useI18n } from "@/providers/i18n.provider";

export function WishlistSheet() {
  const { t } = useI18n();
  const count = useWishlistStore((s) => s.count());
  const mounted = useHydrated();
  // Signed in, the account's list replaces the device's once per page load (and after sign-in).
  const { isLoggedIn } = useAuth();
  useEffect(() => {
    if (isLoggedIn) void load_account_wishlist();
  }, [isLoggedIn]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative cursor-pointer text-foreground"
          // The count joins the name only after mount, like the badge (no hydration mismatch).
          aria-label={
            mounted && count > 0
              ? t("wishlist.label_count", { count })
              : t("header.wishlist")
          }
        >
          <Heart />
          <CountBadge count={count} mounted={mounted} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>{t("wishlist.title")}</SheetTitle>
        </SheetHeader>
        <WishlistItems />
      </SheetContent>
    </Sheet>
  );
}
