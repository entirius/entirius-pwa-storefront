// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Link } from "@entirius/storefront-sdk/components/link";
import type { ProductMedia } from "@entirius/storefront-sdk/product";
import type { SearchProduct } from "@entirius/storefront-sdk/layout";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { ProductThumb } from "@theme/components/product-thumb";
import { ProductPrice } from "@theme/components/product-price";

// The 320 px picture when there is one, else the first size; null gives the placeholder.
export function thumb_src(media: ProductMedia): string | null {
  const set = media[0] ?? [];
  return (set.find((m) => m.width === 320) ?? set[0])?.uri ?? null;
}

export function SearchProductRow({ product, onNavigate }: { product: SearchProduct; onNavigate: () => void }) {
  const i18n = useI18n();

  return (
    <Link
      href={product.href}
      onClick={onNavigate}
      data-product-tile
      data-stock={product.on_stock === false ? "out" : "in"}
      className="grid grid-cols-[5rem_1fr] gap-3 rounded-md border border-border p-2 transition-colors hover:bg-accent"
    >
      <ProductThumb
        src={thumb_src(product.media)}
        alt={product.name || i18n.t("search.product_fallback")}
        sizes="80px"
        className="w-20 unavailable:opacity-60 unavailable:grayscale"
      />
      <div className="min-w-0 self-center unavailable:opacity-70">
        <h4 className="truncate text-sm">{product.name}</h4>
        <div className="mt-0.5">
          <ProductPrice price={product.price} sku={product.sku} compact />
        </div>
        {product.on_stock === false && (
          <span data-sold-out-label className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {i18n.t("product.sold_out")}
          </span>
        )}
      </div>
    </Link>
  );
}
