"use client";

import { useWishlistStore } from "@/stores/wishlist.store";
import { ProductTile } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/product-tile.client";

export function WishlistItems() {
  const items = useWishlistStore((s) => s.items);
  const entries = Object.entries(items);

  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Your wishlist is empty
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto px-4">
      {entries.map(([sku, item]) => (
        <ProductTile key={sku} product={item} variant="compact" />
      ))}
    </div>
  );
}
