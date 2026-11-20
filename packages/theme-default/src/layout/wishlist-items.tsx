// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { Price, WishlistItem } from "@entirius/storefront-sdk/product";
import { useMoveToCart, useWishlistSheet } from "@entirius/storefront-sdk/storefront";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";
import { Spinner } from "@theme/ui/spinner";
import { ProductCard } from "@theme/components/product-card";

function MoveToCart({ item }: { item: WishlistItem & { price: Price } }) {
  const { t } = useI18n();
  const { state, run } = useMoveToCart(item);
  const sold_out = state === "none";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={
        sold_out
          ? t("catalog.quick_add_out_of_stock", { name: item.name })
          : t("wishlist.move_to_cart_named", { name: item.name })
      }
      disabled={sold_out || state === "busy"}
      onClick={run}
    >
      {state === "busy" ? <Spinner className="size-4" /> : sold_out ? t("product.sold_out") : t("wishlist.move_to_cart")}
    </Button>
  );
}

export function WishlistItems() {
  const { t } = useI18n();
  const { items, movable } = useWishlistSheet();

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-1 px-4 py-8 text-center">
        <p className="text-muted-foreground">{t("wishlist.empty")}</p>
        <p className="text-sm text-muted-foreground">{t("wishlist.empty_hint")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto px-4">
      {items.map((item) => (
        <ProductCard
          key={item.sku}
          product={item}
          variant="compact"
          action={item.price && movable(item) ? <MoveToCart item={{ ...item, price: item.price }} /> : undefined}
        />
      ))}
    </div>
  );
}
