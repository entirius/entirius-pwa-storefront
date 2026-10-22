// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useWishlistStore, type WishlistItem } from "@/stores/wishlist.store";
import { remove_from_account } from "@/stores/wishlist-sync";
import { useAuth } from "@/providers/auth.provider";
import { useI18n } from "@/providers/i18n.provider";
import { ProductTile } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/product-tile.client";
import { useQuickAdd } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/use-quick-add";

// One unit into the cart, then off the wishlist. Only for a product with one price: a range (options to
// choose) or a price on request goes through the product page, which the card links to.
function MoveToCart({ item }: { item: WishlistItem & { price: NonNullable<WishlistItem["price"]> } }) {
  const { t } = useI18n();
  const { isLoggedIn } = useAuth();
  const remove = useWishlistStore((s) => s.remove);
  const { state, run } = useQuickAdd(item, () =>
    isLoggedIn ? void remove_from_account(item.sku) : remove(item.sku),
  );
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
  const items = useWishlistStore((s) => s.items);
  const entries = Object.entries(items);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col gap-1 px-4 py-8 text-center">
        <p className="text-muted-foreground">{t("wishlist.empty")}</p>
        <p className="text-sm text-muted-foreground">{t("wishlist.empty_hint")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto px-4">
      {entries.map(([sku, item]) => (
        <ProductTile
          key={sku}
          product={item}
          variant="compact"
          action={item.price && !item.price.from ? <MoveToCart item={{ ...item, price: item.price }} /> : undefined}
        />
      ))}
    </div>
  );
}
