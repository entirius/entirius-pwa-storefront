// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

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
