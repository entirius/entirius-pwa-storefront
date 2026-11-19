// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ReactNode } from "react";
import { Media } from "@entirius/storefront-sdk/components/media";
import { Link } from "@entirius/storefront-sdk/components/link";
import type { ProductCardData } from "@entirius/storefront-sdk/product/card";
import { useProductCard } from "@entirius/storefront-sdk/storefront";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { ProductPrice } from "@theme/components/product-price";
import { QuickAdd } from "@theme/components/quick-add";
import { WishlistButton } from "@theme/components/wishlist-button";

// The example theme's product card: no frame, a tall picture that zooms on hover, the name in small capitals under
// it, the price and the quick add on one line. Same exports as the default card, so every list takes it.
export function ProductCard({
  product,
  variant = "default",
  action,
}: {
  product: ProductCardData;
  variant?: "default" | "compact";
  action?: ReactNode;
}) {
  const { t } = useI18n();
  const compact = variant === "compact";
  const { sold_out, image, single_piece, quick_add, wishlist_item } = useProductCard(product, compact);

  return (
    <Link
      href={`/product/${product.url_key}`}
      data-product-tile
      data-stock={sold_out ? "out" : "in"}
      className={compact ? "group grid grid-cols-[5rem_1fr] gap-3" : "group flex h-full flex-col gap-3"}
    >
      <div className="relative aspect-product overflow-hidden bg-muted">
        <Media
          src={image}
          alt={product.name}
          fill
          sizes={compact ? "80px" : "(max-width: 768px) 50vw, 25vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-105 unavailable:opacity-60 unavailable:grayscale"
        />
        {!compact && (
          <WishlistButton
            sku={product.sku}
            item={wishlist_item}
            className="absolute top-2 right-2 z-raised"
            variant="secondary"
            size="icon-sm"
            onClick={(e) => e.preventDefault()}
          />
        )}
        {sold_out && (
          <span className="absolute bottom-2 left-2 z-raised bg-background px-2 py-1 text-[10px] uppercase tracking-widest text-heading">
            {t("product.sold_out")}
          </span>
        )}
      </div>
      <div className="flex min-w-0 items-end justify-between gap-3 unavailable:opacity-70">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="line-clamp-2 text-xs font-medium uppercase tracking-[0.18em] text-heading">{product.name}</h3>
          <ProductPrice price={product.price} sku={product.sku} compact />
          {single_piece && <p className="text-xs text-muted-foreground">{single_piece}</p>}
          {action}
        </div>
        {quick_add && <QuickAdd item={quick_add} />}
      </div>
    </Link>
  );
}
