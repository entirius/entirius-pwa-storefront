// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useWishlistStore } from "@/stores/wishlist.store";
import { useI18n } from "@/providers/i18n.provider";
import { ProductTile } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/product-tile.client";

export function WishlistItems() {
  const { t } = useI18n();
  const items = useWishlistStore((s) => s.items);
  const entries = Object.entries(items);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col gap-1 py-8 text-center">
        <p className="text-muted-foreground">{t("wishlist.empty")}</p>
        <p className="text-sm text-muted-foreground">{t("wishlist.empty_hint")}</p>
      </div>
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
