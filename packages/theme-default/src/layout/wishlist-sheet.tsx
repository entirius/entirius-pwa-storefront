// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@theme/ui/sheet";
import { useWishlistSheet } from "@entirius/storefront-sdk/storefront";
import { WishlistItems } from "@theme/layout/wishlist-items";
import { Heart } from "lucide-react";
import { Button } from "@theme/ui/button";
import { CountBadge } from "@theme/layout/count-badge";
import { HEADER_ICON } from "@theme/layout/header-icon";
import { useHydrated } from "@entirius/storefront-sdk/hooks";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

export function WishlistSheet() {
  const { t } = useI18n();
  // Controlled, so "View wishlist" in a notice opens it too.
  const { count, open, set_open } = useWishlistSheet();
  const mounted = useHydrated();

  return (
    <Sheet open={open} onOpenChange={set_open}>
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
          <Heart className={HEADER_ICON} />
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
